const logger = require('../util/logger');
const settings = require('../util/settings');
const Modbus = require('../modbus');
const Handler = require('../util/handler');

const handler = Handler.getInstance();

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
      } = device;
      const modbusId = device.modbus_id;
      const baudRate = device.baud_rate;
      settings.addDevice(id, modbusId, baudRate, interval, model);
      const instance = new Modbus(this.mqtt, device);
      instance.start();
      handler.add(device);
      const ackTopic = 'bridge/log';
      const ackMessage = {
        type: 'device_connected',
        friendly_name: id,
      };
      this.mqtt.publish(ackTopic, JSON.stringify(ackMessage));
      break;
    }

    case `${baseTopic}/configure/unset`: {
      const { id } = device;
      const instance = handler.get(id);
      if (instance) {
        instance.remove();
      }
      settings.removeDevice(id);
      break;
    }
    default:
      break;
  }
};
