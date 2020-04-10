const events = require('events');
const _ = require('lodash');
const ModbusRTU = require('modbus-serial');
const modbusHerdsmanConverters = require('@instathings/modbus-herdsman-converters');

const settings = require('./util/settings');
const logger = require('./util/logger');

class Modbus extends events.EventEmitter {
  constructor(model) {
    super();
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
      setInterval(this.poll.bind(this), 1000);
    } catch (err) {
      logger.error('Error while starting modbus connection');
      throw err;
    }
  }

  poll() {
    const result = {};
    const keys = Object.keys(this.descriptor.input);
    keys.map(async (key) => {
      const addressDescriptor = _.get(this.descriptor, `input.${key}`);
      const address = _.get(addressDescriptor, 'address');
      let value;
      console.log('A', address);
      try {
        value = await this.client.readInputRegisters(address, 1);
        console.log('POLL', value);
      } catch (err) {
        console.log(err);
        logger.error(err);
      }
      const { post } = addressDescriptor;
      value = _.get(value, 'data[0]');
      value = (post && value) ? post(value) : value;
      _.set(result, key, value);
    });
    console.log('END');
    console.log(result);
    this.emit('data', result);
  }
}

module.exports = Modbus;
