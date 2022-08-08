const utils = require('../util/utils');
const logger = require('../util/logger');
const settings = require('../util/settings');
const Modbus = require('../modbus');
const Handler = require('../util/handler');

const handler = Handler.getInstance();

module.exports = async function start() {
  const info = await utils.getModbus2mqttVersion();
  logger.info(`Starting modbus2mqtt version ${info.version} (commit #${info.commitHash})`);

  // Start modbus
  try {
    await this.mqtt.connect();
    this.mqtt.subscribe(`${settings.get().mqtt.base_topic}/configure/set`);
    this.mqtt.subscribe(`${settings.get().mqtt.base_topic}/bridge/config/force_remove`);

    const { devices, modbus } = settings.get();
    /* - adjusted by BoogieBug for better control over serial protocal
    const options = {
      baudRate: modbus.baud_rate,
    };
    await this.modbus.connectRTUBuffered(modbus.port, options);
    */
    logger.info(`Opening ${modbus.port} with ${modbus.serial.baudRate} bps ${modbus.serial.dataBits} data bit, ${modbus.serial.parity} parity, ${modbus.serial.stopBits} stop bit.`);
    await this.modbus.connectRTUBuffered(modbus.port, modbus.serial);
    this.modbus.setTimeout(modbus.timeout);

    const deviceIds = Object.keys(devices);
    // eslint-disable-next-line no-restricted-syntax
    for (const i = 0; i < deviceIds.length; i++) {
      const deviceId = deviceIds[i];
      const device = devices[deviceId];
      device.id = deviceId;
      const modbusId = device.modbus_id;
      device.modbusId = modbusId;
      const instance = new Modbus(this.mqtt, this.modbus, device);
      setTimeout( () => {
        instance.start();
      }, (modbus.start_delay || 1000) * i);
      handler.add(instance);
    }
  }
  catch (error) {
    logger.error('Failed to start modbus');
    logger.error('Exiting...');
    logger.error(error.stack);
    process.exit(1);
  }
  this.mqtt.on('message', this.onMQTTMessage.bind(this));
};
