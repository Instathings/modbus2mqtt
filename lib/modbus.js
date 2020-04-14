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
    this.id = device.id;
    this.model = device.model;
    this.interval = device.interval;
    this.modbusId = device.modbus_id;
    this.baudRate = device.baud_rate;
    this.client = new ModbusRTU();
    this.descriptor = modbusHerdsmanConverters.findByModbusModel(this.model);
  }

  async start() {
    const modbusSettings = settings.get().modbus;
    try {
      const options = {
        baudRate: this.baud_rate,
      };
      await this.client.connectRTUBuffered(modbusSettings.port, options);
      await this.client.setID(this.modbusId);
      this.intervalId = setInterval(this.poll.bind(this), this.interval);
    } catch (err) {
      logger.error('Error while starting modbus connection');
      throw err;
    }
  }

  async poll() {
    const result = {};
    const input = _.get(this.descriptor, 'fromModbus.input');
    const keys = Object.keys(input);
    // eslint-disable-next-line
    for await (let key of keys) {
      const addressDescriptor = _.get(input, key);
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
    const topic = `${this.id}`;
    const payload = JSON.stringify(result);
    this.mqtt.publish(topic, payload);
  }

  remove() {
    clearInterval(this.intervalId);
  }
}

module.exports = Modbus;
