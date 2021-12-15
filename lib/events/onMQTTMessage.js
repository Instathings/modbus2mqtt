const logger = require('../util/logger');
const settings = require('../util/settings');
const Modbus = require('../modbus');
const Handler = require('../util/handler');

const handler = Handler.getInstance();

const baseTopic = settings.get().mqtt.base_topic;

module.exports = function onMQTTMessage(payload) {
  try {
    const {topic, message} = payload;
    logger.debug(`Received MQTT message on '${topic}' with data '${message}'`);
    switch (topic) {
      case `${baseTopic}/configure/set`: {
        const parsedMessage = JSON.parse(message);
        // console.log(parsedMessage);
        const {
          id,
          model,
        } = parsedMessage;
        const modbusId = parsedMessage.modbus_id;
        const instance = new Modbus(this.mqtt, this.modbus, parsedMessage);
        settings.addDevice(id, modbusId, model);
        instance.start();
        handler.add(instance);
        const ackTopic = 'bridge/log';
        const ackMessage = {
          type: 'device_connected',
          message: {
            friendly_name: id,
          },
        };
        this.mqtt.publish(ackTopic, JSON.stringify(ackMessage));
        break;
      }

      case `${baseTopic}/bridge/config/force_remove`: {
        const id = message.toString();
        const instance = handler.get(id);
        if (instance) {
          instance.remove();
        }
        settings.removeDevice(id);
        const ackTopic = 'bridge/log';

        const ackMessage = {
          type: 'device_force_removed',
          message: id,
        };
        this.mqtt.publish(ackTopic, JSON.stringify(ackMessage));

        break;
      }
      default:
        break;
    }
  } catch (e) {
    logger.error(`Error while handeling MQTT message: ${e.toString()}`);
  }
};
