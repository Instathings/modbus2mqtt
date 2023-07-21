const { setTimeout } = require('timers/promises');
const events = require('events');
const _ = require('lodash');
const modbusHerdsmanConverters = require('@instathings/modbus-herdsman-converters');

const logger = require('./util/logger');
const { default: ModbusRTU } = require('modbus-serial');

class Modbus extends events.EventEmitter {
  supportedFCs = [3, 4];

  constructor(mqtt, modbus, device) {
    super();
    this.mqtt = mqtt;
    /** @type {ModbusRTU} */
    this.modbus = modbus;
    this.id = device.id;
    this.model = device.model;
    this.modbusId = device.modbus_id;
    this.descriptor = modbusHerdsmanConverters.findByModbusModel(this.model);
    if (this.descriptor === undefined) {
      throw (Error(`Device ${device.id} has unkown model: ${this.model}`));
    }
    this.interval = process.env.INTERVAL || 30000;
  }

  async start() {
    try {
      await this.poll();
    } catch (err) {
      logger.error('Error while polling');
    } finally {
      if (!this.stop) {
        process.nextTick(async () => {
          await setTimeout(this.interval);
          this.start();
        });
      }
    }
  }

  /**
   * the modbus function code. now supports only 3 and 4. default is 4
   * @param {number[]} functionCodes default is [3, 4]
   */
  async pollRegisters(functionCodes = this.supportedFCs) {
    if (!functionCodes) throw Error('function code must be provided for polling');
    await this.modbus.setID(this.modbusId);
    const result = {};
    for (const fc of functionCodes) {
      const descriptorRegistersProperty = fc === 4 ? 'input' : 'keep';
      const input = _.get(this.descriptor, `fromModbus.${descriptorRegistersProperty}`);
      const keys = Object.keys(input);
      if (!this.supportedFCs.includes(fc)) {
        console.error(`FC${fc} not supported. skipping to next FC...`);
        continue;
      }
      let promise;
      if (fc === 3) {
        promise = this.modbus.readHoldingRegisters.bind(this.modbus)
      } else if (fc === 4) {
        promise = this.modbus.readInputRegisters.bind(this.modbus)
      } else {
        console.error(`FC${fc} not supported. skipping to next FC...`);
        continue;
      }
      // eslint-disable-next-line
      for (let key of keys) {
        const addressDescriptor = _.get(input, key);
        const address = _.get(addressDescriptor, 'address');
        let value;
        const registersCountToRead = _.get(addressDescriptor, 'count') || 1;
        try {
          // eslint-disable-next-line no-await-in-loop
          value = await promise(address, registersCountToRead);
          // eslint-disable-next-line no-await-in-loop
          await setTimeout(1000);
          const { post } = addressDescriptor;
          const interpreted = registersCountToRead === 1 ? _.get(value, 'data[0]') : value.data;
          const raw = _.get(value, 'buffer');
          value = (post) ? post(interpreted, raw) : interpreted;
          _.set(result, key, value);
        } catch (err) {
          logger.error(`While handling Modbus: ${err.toString()}`);
        }
      }
    }

    const topic = `${this.id}`;
    const payload = JSON.stringify(result);
    this.mqtt.publish(topic, payload);
  }

  async poll() {
    try {
      await this.modbus.setID(this.modbusId);
      // error handling is done within the invoked function so we can call both polls sequentially
      await this.pollRegisters();
    } catch (err) {
      logger.error(err);
    }
  }

  remove() {
    this.stop = true;
  }
}

module.exports = Modbus;
