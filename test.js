const mqtt = require('mqtt');

async function test() {
  const client = await mqtt.connect('mqtt://localhost');
  console.log('connected');
  const payload = {
    id: 'xfwog',
    modbus_id: 1,
    baud_rate: 9600,
    interval: 10000,
    model: 'xy-md02',
  };
  await client.publish('modbus2mqtt/configure/set', JSON.stringify(payload));
  console.log('PUBLISHED');
}

test();
