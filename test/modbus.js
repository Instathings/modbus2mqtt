const assert = require('assert');
const sinon = require('sinon');
const Modbus = require('../lib/modbus');

describe('Modbus class', () => {
  const model = 'xy-md02';
  const mqtt = 'mqtt';
  const modbus = 'modbus';
  const device = {
    id: 'id',
    model,
    modbus_id: 'modbus_id',
  };

  it('should init constructor parameters correctly', () => {
    const instance = new Modbus(mqtt, modbus, device);
    assert.strictEqual(instance.mqtt, mqtt);
    assert.strictEqual(instance.modbus, modbus);
    assert.strictEqual(instance.modbusId, device.modbus_id);
    assert.strictEqual(instance.descriptor.model, model);
  });

  it('start method should call poll until stop is true', async () => {
    return new Promise(async (done) => {
      const instance = new Modbus(mqtt, modbus, device);
      const stub = sinon.stub(instance, 'poll');
      stub.onCall(0).callsFake(() => new Promise((resolve) => {
        instance.stop = true;
        resolve();
        sinon.assert.calledOnce(stub);
        done();
      }));
      await instance.start();
    });
  });

  it('should set stop to true if remove is called', () => {
    const instance = new Modbus(mqtt, modbus, device);
    assert.equal(instance.stop, undefined);
    instance.remove();
    assert.strictEqual(instance.stop, true);
  });
});
