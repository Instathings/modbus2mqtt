const events = require('events');
const _ = require('lodash');
const modbusHerdsmanConverters = require('@instathings/modbus-herdsman-converters');

const logger = require('./util/logger');

class Modbus extends events.EventEmitter {
  constructor(mqtt, modbus, device) {
    super();
    this.mqtt = mqtt;
    this.modbus = modbus;
    this.id = device.id;
    this.model = device.model;
    this.modbusId = device.modbus_id;
    this.descriptor = modbusHerdsmanConverters.findByModbusModel(this.model);
    this.interval = process.env.INTERVAL || 10000;
  }

  // eslint-disable-next-line class-methods-use-this
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async start() {
    try {
      await this.poll();
    } catch (err) {
      logger.error('Error while polling');
    } finally {
      if (!this.stop) {
        process.nextTick(async () => {
          await this.sleep(this.interval);
          this.start();
        });
      }
    }
  }

  async poll() {
    try {
      await this.modbus.setID(this.modbusId);
      const result = {};
      const input = _.get(this.descriptor, 'fromModbus.input');
      const keys = Object.keys(input);
      // eslint-disable-next-line
      for await (let key of keys) {
        const addressDescriptor = _.get(input, key);
        const address = _.get(addressDescriptor, 'address');
        let value;
        try {
          logger.debug(`Polling modbus device ${this.id}, modbusId=${this.modbusId}, address=${address}`);
          value = await this.modbus.readInputRegisters(address, 1);
        } catch (err) {
          logger.error(err);
        }
        const { post } = addressDescriptor;
        const interpeted = _.get(value, 'data[0]');
        const raw = _.get(value, 'buffer');
        value = (post) ? post(interpeted, raw) : value;
        _.set(result, key, value);
      }
      const topic = `${this.id}`;
      const payload = JSON.stringify(result);
      this.mqtt.publish(topic, payload);
    } catch (err) {
      logger.error(err);
    }
  }

  remove() {
    this.stop = true;
  }
}

module.exports = Modbus;
