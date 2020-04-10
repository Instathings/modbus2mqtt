const events = require('events');
const _ = require('lodash');
const ModbusRTU = require('modbus-serial');
const modbusHerdsmanConverters = require('@instathings/modbus-herdsman-converters');

const settings = require('./util/settings');
const logger = require('./util/logger');

class Modbus extends events.EventEmitter {
  constructor(mqtt, device) {
    super();
    this.mqtt = mqtt;
    this.device = device; // {id, model }
    this.client = new ModbusRTU();
    this.descriptor = modbusHerdsmanConverters.findByModbusModel('xy-md02');
  }

  async start() {
    const modbusSettings = settings.get().modbus;
    try {
      const options = {
        baudRate: modbusSettings.baud_rate,
      };
      await this.client.connectRTUBuffered(modbusSettings.port, options);
      await this.client.setID(1);
      this.interval = setInterval(this.poll.bind(this), 1000);
    } catch (err) {
      logger.error('Error while starting modbus connection');
      throw err;
    }
  }

  async poll() {
    const result = {};
    const keys = Object.keys(this.descriptor.input);
    // eslint-disable-next-line
    for await (let key of keys) {
      const addressDescriptor = _.get(this.descriptor, `input.${key}`);
      const address = _.get(addressDescriptor, 'address');
      let value;
      try {
        value = await this.client.readInputRegisters(address, 1);
      } catch (err) {
        logger.error(err);
      }
      const { post } = addressDescriptor;
      value = _.get(value, 'data[0]');
      value = (post && value) ? post(value) : value;
      _.set(result, key, value);
    }
    const topic = `${settings.get().mqtt.base_topic}/${this.device.id}`;
    const payload = JSON.stringify(result);
    this.mqtt.publish(topic, payload);
  }
}

module.exports = Modbus;
