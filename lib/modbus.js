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
      const factor  = parseFloat(_.get(addressDescriptor, 'factor'));
      const length  = parseInt(_.get(addressDescriptor, 'length', 1)); // 1 element by default

      // size in byte(s) by type
      const sizes = {
        float: 4,   'float[]': 4,
        float32: 4, 'float32[]': 4,
        int32: 4,   'int32[]': 4,
        uint32: 4,  'uint32[]': 4,
        int: 2,     'int[]': 2,
        int16: 2,   'int16[]': 2,
        uint: 2,    'uint[]': 2,
        uint16: 2,  'uint16[]': 2
      }
      const size = ( sizes[type] || 1 );
      // -- end of added by BoogieBug

      let value;
      let result;

      try {
        if ( functionCode === 4 ) {
          result = await this.modbus.readInputRegisters(address, size * length);
        }
        else {
          result = await this.modbus.readHoldingRegisters(address, size * length);
        }
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
          value = ( endian == 'little' ) ? result.buffer.readFloatLE() : result.buffer.readFloatBE();
        break;

        case 'float[]':
          value = [];
          for ( let i = 0; i < length; i++ ) {
            value.push(( endian == 'little' ) ? result.buffer.readFloatLE(i * size) : result.buffer.readFloatBE(i * size));
          }
        break;

        case 'float32':
          value = ( endian == 'little' ) ? result.buffer.readFloatLE() : result.buffer.readFloatBE();
        break;

        case 'float32[]':
          value = [];
          for ( let i = 0; i < length; i++ ) {
            value.push(( endian == 'little' ) ? result.buffer.readFloatLE(i * size) : result.buffer.readFloatBE(i * size));
          }
        break;

        case 'int32':
          value = ( endian == 'little' ) ? valresultue.buffer.readInt32LE() : result.buffer.readInt32BE();
        break;

        case 'int32[]':
          value = [];
          for ( let i = 0; i < length; i++ ) {
            value.push(( endian == 'little' ) ? result.buffer.readInt32LE(i * size) : result.buffer.readInt32BE(i * size));
          }
        break;

        case 'uint32':
          value = ( endian == 'little' ) ? result.buffer.readUInt32LE() : result.buffer.readUInt32BE();
        break;

        case 'uint32[]':
          value = [];
          for ( let i = 0; i < length; i++ ) {
            value.push( ( endian == 'little' ) ? result.buffer.readUInt32LE(i * size) : result.buffer.readUInt32BE(i * size) );
          }
        break;

        case 'int':
          value = ( endian == 'little' ) ? result.buffer.readInt16LE() : result.buffer.readInt16BE();
        break;

        case 'int[]':
          value = [];
          for ( let i = 0; i < length; i++ ) {
            value.push( ( endian == 'little' ) ? result.buffer.readInt16LE(i * size) : result.buffer.readInt16BE(i * size) );
          }
        break;

        case 'int16':
          value = ( endian == 'little' ) ? result.buffer.readInt16LE() : result.buffer.readInt16BE();
        break;

        case 'int16[]':
          value = [];
          for ( let i = 0; i < length; i++ ) {
            value.push( ( endian == 'little' ) ? result.buffer.readInt16LE(i*2) : result.buffer.readInt16BE(i*2) );
          }
        break;

        case 'uint':
          value = ( endian == 'little' ) ? result.buffer.readUInt16LE() : result.buffer.readUInt16BE();
        break;

        case 'uint[]':
          value = [];
          for ( let i = 0; i < length; i++ ) {
            value.push( ( endian == 'little' ) ? result.buffer.readUInt16LE() : result.buffer.readUInt16BE() );
          }
        break;

        case 'uint16':
          value = ( endian == 'little' ) ? result.buffer.readUInt16LE() : result.buffer.readUInt16BE();
        break;

        case 'uint16[]':
          value = [];
          for ( let i = 0; i < length; i++ ) {
            value.push( ( endian == 'little' ) ? result.buffer.readUInt16LE(i*2) : result.buffer.readUInt16BE(i*2) );
          }
        break;

        default:
          console.warning(`Unknown type - ${type}, assume 'Uint16'`);
          value = ( endian == 'little' ) ? result.buffer.readUInt16LE() : result.buffer.readUInt16BE();
        break;
      }

      // factor adjustment, only on primitive type
      if ( ! Array.isArray(value) && ! isNaN(factor) ) {
        value = value * factor;
      }

      const post_processor = _.get(addressDescriptor, 'post', null);
      if ( post_processor !== null ) {
        value = post_processor(value);
      }

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
