const events = require('events');
const _ = require('lodash');
const modbusHerdsmanConverters = require('@instathings/modbus-herdsman-converters');

const logger = require('./util/logger');
const { default: ModbusRTU } = require('modbus-serial');

class Modbus extends events.EventEmitter {
  constructor(mqtt, modbus, device) {
    super();
    this.mqtt = mqtt;
    /** @type {ModbusRTU} */
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

  /**
   * the modbus function code. now supports only 3 and 4. default is 4
   * @param {number} functionCode default is 4
   */
  async pollRegistersByFC(functionCode = 4) {
    if (!functionCode) throw Error("function code must be provided for polling");
    if (functionCode !== 3 && functionCode !== 4) throw Error("only FC3 and FC4 are supported for polling");
    const descriptorRegistersProperty = functionCode === 4 ? "input": "keep";
    await this.modbus.setID(this.modbusId);
    const result = {};
    const input = _.get(this.descriptor, `fromModbus.${descriptorRegistersProperty}`);
    const keys = Object.keys(input);
    // eslint-disable-next-line
    for (let key of keys) {
      const addressDescriptor = _.get(input, key);
      const address = _.get(addressDescriptor, 'address');
      let value;
      try {
        const promise = functionCode === 4 ? 
          this.modbus.readInputRegisters.bind(this.modbus) :
          this.modbus.readHoldingRegisters.bind(this.modbus);
        value = await promise(address, 1);
      } catch (err) {
        logger.error(err);
      }
      const { post } = addressDescriptor;
      const interpreted = _.get(value, 'data[0]');
      const raw = _.get(value, 'buffer');
      value = (post) ? post(interpreted, raw) : interpreted;
      _.set(result, key, value);
    }
    const topic = `${this.id}`;
    const payload = JSON.stringify(result);
    this.mqtt.publish(topic, payload);
  }

  async poll() {
    try {
      await this.modbus.setID(this.modbusId);
      // error handling is done within the invoked function so we can call both polls sequentially
      await this.pollRegistersByFC(3);
      await this.pollRegistersByFC(4);
    } catch (err) {
      logger.error(err);
    }
  }

  remove() {
    this.stop = true;
  }
}

module.exports = Modbus;
