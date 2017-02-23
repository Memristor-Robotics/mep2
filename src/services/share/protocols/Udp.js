'use strict';
/** @namespace services.share.protocols */

const EventEmitter = require('events').EventEmitter;
const dgram = require('dgram');

const TAG = 'Udp';

/**
 * Provides sharing based on UDP protocol. Same prototype should be used for other protocols.
 *
 * @memberOf services.share.protocols
 * @fires services.share.protocols.Udp#packet
 * @author Darko Lukic <lukicdarkoo@gmail.com>
 */
class Udp extends EventEmitter {
    constructor(config) {
        super();

        this.config = Object.assign({
            sourcePort: 9001,
            destinationPort: 9001,
            ip: '255.255.255.255',
            broadcast: true
        }, config);

        this._onMessageReceived = this._onMessageReceived.bind(this);

        // Set up socket
        this.socket = dgram.createSocket('udp4');
        this.socket.bind(this.config.sourcePort, '0.0.0.0');
        if (this.config.broadcast === true) {
            let socket = this.socket;
            this.socket.on('listening', () => {
                socket.setBroadcast(true);
            });
        }
        this.socket.on('message', this._onMessageReceived);
    }

    _onMessageReceived(data) {
        try {
            let parsedData = JSON.parse(data.toString());

            /**
             * Packet arrived
             * @event services.share.protocols.Udp#packet
             * @property parsedData {Object} - Received packet
             */
            this.emit(
                'packet',
                parsedData
            );
        } catch (e) {
            Mep.Log.warn(TAG, 'Error parsing packet:', data.toString());
        }
    }

    send(packet) {
        let data = JSON.stringify(packet);
        this.socket.send(data, 0, data.length, this.config.destinationPort, this.config.ip);
    }
}

module.exports = Udp;