const utils = require('../util/utils');
const logger = require('../util/logger');
const settings = require('../util/settings');
const Modbus = require('../modbus');
const Handler = require('../util/handler');

const handler = Handler.getInstance();

module.exports = async function start() {
  const info = await utils.getModbus2mqttVersion();
  logger.info(`Starting modbus2mqtt version ${info.version} (commit #${info.commitHash})`);
  logger.debug(`Debugging enabled.`);

  // Start modbus
  try {
    await this.mqtt.connect();
    this.mqtt.subscribe(`${settings.get().mqtt.base_topic}/configure/set`);
    this.mqtt.subscribe(`${settings.get().mqtt.base_topic}/bridge/config/force_remove`);
    const { devices, modbus } = settings.get();
    const options = {
      baudRate: modbus.baud_rate,
      parity: modbus.parity ? modbus.parity : 'none',
      dataBits: modbus.data_bits ? modbus.data_bits : 8,
      stopBits: modbus.stop_bits ? modbus.stop_bits : 1,
    };
    await this.modbus.connectRTUBuffered(modbus.port, options);
    this.modbus.setTimeout(1000);

    const deviceIds = Object.keys(devices);
    // eslint-disable-next-line no-restricted-syntax
    for (const deviceId of deviceIds) {
      const device = devices[deviceId];
      device.id = deviceId;
      const modbusId = device.modbus_id;
      device.modbusId = modbusId;
      const instance = new Modbus(this.mqtt, this.modbus, device);

      instance.start();
      handler.add(instance);
    }
  } catch (error) {
    logger.error('Failed to start modbus');
    logger.error('Exiting...');
    logger.error(error.stack);
    process.exit(1);
  }
  this.mqtt.on('message', this.onMQTTMessage.bind(this));
};
