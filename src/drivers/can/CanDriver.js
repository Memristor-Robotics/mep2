'use strict';

/** @namespace drivers.can */

const EventEmitter = require('events').EventEmitter;
const CAN = require('socketcan');
const exec = require('child_process').execSync;
const Buffer = require('buffer').Buffer;

const TAG = 'CanDriver';

/**
 * Driver for CAN bus (Controller Area Network)
 * @emits drivers.can.CanDriver#data Emit event when data arrive
 * @emits drivers.can.CanDriver#data_[id] Emit event when data arrive for given `id`
 * @memberOf drivers.can
 */
class CanDriver extends EventEmitter {

    /**
     * @param {String} name Unique name of a driver
     * @param {Object} config Configuration presented as an associative array
     * @param {String} config.device Device ID
     * @param {Number} config.bitrate CAN bus speed
     */
    constructor(name, config) {
        super();
        let canDriver = this;

        this.name = name;
        this.config = Object.assign({
            device: 'can0',
            bitrate: 125000
        }, config);

        this._enabled = true;

        this._startCAN(this.config.device, this.config.bitrate);

        this.channel = CAN.createRawChannel(this.config.device, true);
        this.channel.addListener('onMessage', (message) => {
            /**
             * Data arrived for specific ID.
             * @event drivers.can.CanDriver#data_[id]
             * @property {Buffer} data - Data received from CAN
             */
            canDriver.emit('data_' + message.id, message.data);

            /**
             * Data arrived.
             * @event drivers.can.CanDriver#data
             * @property {Number} id ID of the function
             * @property {Buffer} data Data received from CAN
             */
            canDriver.emit('data', message.id, message.data);

            // Mep.Log.debug(TAG, 'Message received', message);
        });
        this.channel.start();

        Mep.Log.debug(TAG, 'Driver with name', name, 'initialized');
    }

    enable() {
        this._enabled = true;
    }

    disable() {
        this._enabled = false;
    }

    /**
     * Send buffer to specific ID
     * @param {Number} id Device ID
     * @param {Buffer} buffer Data
     * @example
     * canDriver.send(0x4324234, Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72, 0x00, 0x00]));
     */
    send(id, buffer) {
        if (this._enabled === true) {
            let canMessage = {
                id: id,
                ext: true,
                rtr: false,
                data: buffer
            };
            //Mep.Log.debug(TAG, 'Buffer sent', buffer);
            this.channel.send(canMessage);
        }
    }

    /**
     * Start CAN bus device
     * @param {String} device
     * @param {Number} bitrate
     * @private
     */
    _startCAN(device, bitrate) {
        let result;

        exec('sudo ip link set ' + device + ' down type can');

        result = exec('sudo ip link set ' + device + ' up type can bitrate ' + bitrate);
        if (result.toString()) {
            Mep.Log.error(TAG, result.toString());
            Mep.driverManager.putDriverOutOfOrder(this.name);
        }
    }

    getGroups() {
        return [];
    }
}

module.exports = CanDriver;
