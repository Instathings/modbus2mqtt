const utils = require('../util/utils');
const logger = require('../util/logger');
const settings = require('../util/settings');
const Modbus = require('../modbus');

module.exports = async function start() {
  const info = await utils.getModbus2mqttVersion();
  logger.info(`Starting modbus2mqtt version ${info.version} (commit #${info.commitHash})`);

  // Start modbus
  try {
    await this.mqtt.connect();
    this.mqtt.subscribe(`${settings.get().mqtt.base_topic}/configure/set`);
    this.mqtt.subscribe(`${settings.get().mqtt.base_topic}/configure/unset`);
    console.log('START');
    // const device = {
    //   id: 1,
    //   model: 'xy-md02',
    // };
    // const mb = new Modbus(this.mqtt, device);
    // mb.start();
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

  // Call extensions
  // await this.callExtensionMethod('onMQTTConnected', []);
};
