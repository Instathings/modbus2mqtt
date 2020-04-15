const ModbusRTU = require('modbus-serial');
const MQTT = require('./mqtt');

const start = require('./methods/start');

const onMQTTMessage = require('./events/onMQTTMessage');

class Controller {
  constructor() {
    this.mqtt = new MQTT();
    this.modbus = new ModbusRTU();
  }
}

Object.assign(Controller.prototype, {
  start,
  onMQTTMessage,
});

module.exports = Controller;
