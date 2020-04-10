const logger = require('../util/logger');

module.exports = function onMQTTMessage(payload) {
  const { topic, message } = payload;
  logger.debug(`Received MQTT message on '${topic}' with data '${message}'`);

  // Call extensions
  // this.callExtensionMethod('onMQTTMessage', [topic, message]);
};
