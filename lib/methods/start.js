const utils = require('../util/utils');
const logger = require('../util/logger');

module.exports = async function start() {
  const info = await utils.getModbus2mqttVersion();
  logger.info(`Starting modbus2mqtt version ${info.version} (commit #${info.commitHash})`);

  // Start modbus
  try {
    await this.modbus.start();
    // this.callExtensionMethod('onmodbusStarted', []);
    // this.modbus.on('event', this.onModbusEvent.bind(this));
    // this.modbus.on('adapterDisconnected', this.onModbusAdapterDisconnected);
  } catch (error) {
    logger.error('Failed to start modbus');
    logger.error('Exiting...');
    logger.error(error.stack);
    process.exit(1);
  }

  // MQTT
  this.mqtt.on('message', this.onMQTTMessage.bind(this));
  await this.mqtt.connect();

  // Call extensions
  // await this.callExtensionMethod('onMQTTConnected', []);
};
