const events = require('events');
const _ = require('lodash');
const modbusHerdsmanConverters = require('@instathings/modbus-herdsman-converters');

const settings = require('./util/settings'); // added by BoogieBug
const logger = require('./util/logger');
const { default: ModbusRTU } = require('modbus-serial');
const delay = ms => new Promise(r => setTimeout(r, ms));

class Modbus extends events.EventEmitter {
  constructor(mqtt, modbus, device) {
    super();
    this.mqtt = mqtt;
    /** @type {ModbusRTU} */
    this.modbus    = modbus;
    this.id        = device.id;
    this.model     = device.model;
    this.modbusId  = device.modbus_id;
    this.start_delay = device.start_delay || 0;
    //this.device = modbusHerdsmanConverters.findByModbusModel(this.model); // by BoogieBug, using the code below instead
    //this.interval = process.env.INTERVAL || 10000;
    this.interval = Math.max(device.interval || process.env.INTERVAL || 10000, 100); // 100 ms minimum

    // added by BoogieBug
    // search device from Herdsman or local drivers (in ./drivers)
    let drivers = settings.get().drivers || [];
    this.device = modbusHerdsmanConverters.findByModbusModel(this.model) ||
                  drivers.find( driver => driver.model == this.model ) || null;
    if ( ! this.device ) {
      console.warn(`Unknown MODBUS device - ${this.model} `);
    }
    // end of code added by BoogieBug
  }

  // eslint-disable-next-line class-methods-use-this
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async start() {
    try {
      if ( this.start_delay > 0 ) {
        await this.sleep(this.start_delay);
        this.start_delay = 0;
      }
      await this.poll();
    }
    catch (err) {
      logger.error('Error while polling');
    }
    finally {
      if ( ! this.stop ) {
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

    if (!functionCode) throw Error('function code must be provided for polling');
    if (functionCode !== 3 && functionCode !== 4) throw Error('only FC3 and FC4 are supported for polling');

    const descriptorRegistersProperty = functionCode === 4 ? 'input' : 'keep';
    const input  = _.get(this.device, `fromModbus.${descriptorRegistersProperty}`, false);
    if ( ! input ) return; // this section is not defined, should not proceed anymore, - added by BoogieBug

    const result = {};
    const endian = _.get(this.device, 'endian', 'big').toLowerCase();

    await this.modbus.setID(this.modbusId);

    const keys = Object.keys(input);
    // eslint-disable-next-line
    let dataAvailable = false;
    for (let key of keys) {
      const addressDescriptor = _.get(input, key);
      // -- added by Boogiebug
      const address = parseInt(_.get(addressDescriptor, 'address', 0));
      const type    = _.get(addressDescriptor, 'type', 'int16').toLowerCase();
      const length  = parseInt(_.get(addressDescriptor, 'length', 1)); // 1 word by default
      const factor  = parseFloat(_.get(addressDescriptor, 'factor'));
      // -- end of added by BoogieBug

      let value;
      try {
        /*
        const promise = functionCode === 4
          ? this.modbus.readInputRegisters.bind(this.modbus)
          : this.modbus.readHoldingRegisters.bind(this.modbus);
        // eslint-disable-next-line no-await-in-loop
        // -- by BoogieBug
        //value = await promise(address, 1);
        value = await promise(address, length);
        */
        if ( functionCode === 4 ) {
          value = await this.modbus.readInputRegisters(address, length);
        }
        else {
          value = await this.modbus.readHoldingRegisters(address, length);
        }
        // eslint-disable-next-line no-await-in-loop
        //await delay(300);
      }
      catch (err) {
        if ( err.errno == 'ETIMEDOUT') {
          logger.error(`MODBUS timeout reading address ${address} of id ${this.modbusId}`);
          continue;
        }
        logger.error('Error while reading register: ' + key + ':' + JSON.stringify(addressDescriptor, null, 2));
        continue;
      }

      // data conversion
      switch ( type ) {

        case 'float':
        case 'float32':
          value = ( endian == 'little' ) ? value.buffer.readFloatLE() : value.buffer.readFloatBE();
        break;

        case 'int32':
          value = ( endian == 'little' ) ? value.buffer.readInt32LE() : value.buffer.readInt32BE();
        break;

        case 'uint32':
          value = ( endian == 'little' ) ? value.buffer.readUInt32LE() : value.buffer.readUInt32BE();
        break;

        case 'int16':
          value = ( endian == 'little' ) ? value.buffer.readInt16LE() : value.buffer.readInt16BE();
        break;

        case 'uint16':
          value = ( endian == 'little' ) ? value.buffer.readUInt16LE() : value.buffer.readUInt16BE();
        break;

        default:
          value = value.buffer.readUInt16BE();
        break;
      }

      // factor adjustment
      if ( ! isNaN(factor) ) {
        value = value * factor;
      }

      const post_processor = _.get(addressDescriptor, 'post', null);
      if ( post_processor !== null ) {
        value = post_processor(value);
      }

      /*
      const { post } = addressDescriptor;
      const interpreted = _.get(value, 'data[0]');
      const raw = _.get(value, 'buffer');
      value = (post) ? post(interpreted, raw) : interpreted;
      */


      // mark data avilable flag
      dataAvailable = true;
      _.set(result, key, value);
    }

    if ( ! dataAvailable ) return;

    const topic = `${this.id}`;
    const payload = JSON.stringify({
      time: Date.now(),
      data: result
    });
    this.mqtt.publish(topic, payload);
  }

  async poll() {
    try {
      await this.modbus.setID(this.modbusId);
      // error handling is done within the invoked function so we can call both polls sequentially
      await this.pollRegistersByFC(3);
      await this.pollRegistersByFC(4);
    }
    catch (err) {
      logger.error(err.message);
      //logger.error(err.stack);
    }
  }

  remove() {
    this.stop = true;
  }
}

module.exports = Modbus;
