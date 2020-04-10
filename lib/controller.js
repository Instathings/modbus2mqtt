const MQTT = require('./mqtt');
const Modbus = require('./modbus');

const start = require('./methods/start');

const onMQTTMessage = require('./events/onMQTTMessage');

class Controller {
  constructor() {
    this.modbus = new Modbus();
    this.mqtt = new MQTT();
  }
}

Object.assign(Controller.prototype, {
  start,
  onMQTTMessage,
});

module.exports = Controller;
