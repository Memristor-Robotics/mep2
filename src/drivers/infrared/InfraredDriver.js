'use strict';

/** @namespace drivers.infrared */

const EventEmitter = require('events').EventEmitter;
const Point = Mep.require('misc/Point');
const Polygon = Mep.require('misc/Polygon');

const TAG = 'InfraredDriver';

/**
 * Uses data from infrared sensors to determine where is an enemy robot and other obstacles.
 *
 * @memberof drivers.infrared
 * @author Darko Lukic <lukicdarkoo@gmail.com>
 * @fires drivers.infrared.InfraredDriver#obstacleDetected
 */
class InfraredDriver extends EventEmitter {
    /**
     * Make instance of InfraredDriver.
     *
     * <pre>
     * Check image bellow to understand `sensorAngle`, `sensorX` & `sensorY`
     *  s1   s2   s3
     *   \   |   /
     *  |---------|
     *  |  Robot  |
     *  |_________|
     *
     *  Sensor s1 params: sensorAngle~=60, sensorY~-10, sensorX~=10
     *  Sensor s2 params: sensorAngle~=90, sensorY~=0, sensorX~=10
     *  Sensor s3 params: sensorAngle~=110, sensorY~=10, sensorX~=10
     *  </pre>
     *
     * @param name {String} - Unique driver name
     * @param config.infraredMaxDistance {Number} - Maximum distance when driver detects an object
     * @param config.sensorAngle {Number} - Angle relative to the robot (look at the picture above)
     * @param config.sensorX {Number} - Sensor translated on x coordinate
     * @param config.sensorY {Number} - Sensor translated on y coordinate
     * @param config.deviceId {Number} - Function ID for CAN driver
     * @param config.objectSize {Number} - Approximation coefficient for obstacle size. Distance between edges and point of interest,
     * @param config['@dependencies'] {String} - ID of Driver can provide communication between core and electronics
     */
    constructor(name, config) {
        super();

        // Check arguments
        if (typeof config.infraredMaxDistance === 'undefined') {
            throw '`config.infraredMaxDistance` is not defined';
        }
        if (typeof config.deviceId === 'undefined') {
            throw '`config.deviceId` is not defined';
        }
        if (typeof config['@dependencies'].communicator === 'undefined') {
            throw 'Infrared driver requires driver which enables communication with electronics board (eg. CanDriver)';
        }
        this.config = Object.assign({
            duration: 2000,
            objectSize: 150,
            sensorX: 0,
            sensorY: 0,
            sensorAngle: 90
        }, config);
        this.name = name;
        this.detected = false;
        this.timeoutHandle = null;

        // Subscribe on communicator
        this.canDriver = Mep.getDriverManager().getDriver(this.config['@dependencies'].communicator);
        this.canDriver.on('data_' + this.config.deviceId, this.processDetection.bind(this));


        // Approximation of detected object
        this.poi = new Point(this.config.sensorX, this.config.sensorY + this.config.infraredMaxDistance);
        this.polygon = new Polygon(name, this.config.duration, [
            new Point(this.poi.getX() - this.config.objectSize, this.poi.getY() - this.config.objectSize),
            new Point(this.poi.getX() + this.config.objectSize, this.poi.getY() - this.config.objectSize),
            new Point(this.poi.getX() + this.config.objectSize, this.poi.getY() + this.config.objectSize),
            new Point(this.poi.getX() - this.config.objectSize, this.poi.getY() + this.config.objectSize)
        ]);

        // We are using inverted (`-`) angle because X and Y coordinate are replaced
        this.poi.rotate(new Point(this.config.sensorX, this.config.sensorY), - this.config.sensorAngle);
        this.polygon.rotate(new Point(this.config.sensorX, this.config.sensorY), - this.config.sensorAngle);

        // Additional information
        this.front = (this.config.sensorAngle > 0 && this.config.sensorAngle < 180);

        Mep.Log.debug(TAG, name, 'Detects at', this.poi);


        // Let's try to simulate
        let infraredDriver = this;
        if (name === 'InfraredAuto') {
            Mep.Log.info(TAG, 'Is in testing mode');
            setTimeout(() => {
                infraredDriver.processDetection(Buffer.from([0x01]));
            }, 5000);
            setTimeout(() => {
                infraredDriver.processDetection(Buffer.from([0x00]));
            }, 10 * 1000);
        }
    }

    /**
     * Process detected obstacle
     *
     * @private
     * @param state {boolean} - Object is detected or not
     */
    processDetection(buffer) {
        this.detected = !!(buffer.readInt8(0));

        /**
         * Obstacle detected event.
         * @event drivers.infrared.InfraredDriver#obstacleDetected
         * @property {String} - Source name
         * @property {misc.Point} - Center of detected obstacle
         * @property {misc.Polygon} - Obstacle is approximated with a polygon
         * @property {Boolean} - Is objected detected or not
         * @property {Object} - Additional information about detected object
         */
        this.emit('obstacleDetected', this.name, this.poi, this.polygon, this.detected);

        // After `duration` publish obstacle detection again if object is still there
        if (this.timeoutHandle !== null) {
            clearTimeout(this.timeoutHandle);
        }
        if (this.detected === true) {
            let infraredDriver = this;
            this.timeoutHandle = setTimeout(() => {
                infraredDriver.processDetection(buffer);
            }, this.config.duration);
        }

        Mep.Log.debug(TAG, 'Detected at', this.poi);
    }

    getGroups() {
        return ['terrain'];
    }
}

module.exports = InfraredDriver;