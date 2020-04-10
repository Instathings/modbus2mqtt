const MQTT = require('./mqtt');

const start = require('./methods/start');

const onMQTTMessage = require('./events/onMQTTMessage');

class Controller {
  constructor() {
    this.mqtt = new MQTT();
  }
}

Object.assign(Controller.prototype, {
  start,
  onMQTTMessage,
});

module.exports = Controller;
