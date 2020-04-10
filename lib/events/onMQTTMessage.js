const logger = require('../util/logger');
const settings = require('../util/settings');
const Modbus = require('../modbus');

const baseTopic = settings.get().mqtt.base_topic;

module.exports = function onMQTTMessage(payload) {
  const { topic, message } = payload;
  logger.debug(`Received MQTT message on '${topic}' with data '${message}'`);
  const device = JSON.parse(message);
  switch (topic) {
    case `${baseTopic}/configure/set`: {
      const {
        id,
        interval,
        model,
        modbusId,
      } = device;
      const baudRate = device.baud_rate;
      settings.addDevice(id, modbusId, baudRate, interval, model);
      const instance = new Modbus(this.mqtt, device);
      instance.start();
      break;
    }

    case `${baseTopic}/configure/unset`: {
      const { id } = parsed;
      settings.removeDevice(id);
      break;
    }
    default:
      break;
  }
};
