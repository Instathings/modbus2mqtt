const mqtt = require('mqtt');

async function test() {
  const client = await mqtt.connect('mqtt://localhost');
  await client.subscribe('modbus2mqtt/bridge/log');
  client.on('message', (topic, message) => {
    console.log(topic, message.toString());
  });
  // console.log('connected');
  // const payload = {
  //   id: 'xfwog',
  //   modbus_id: 1,
  //   model: 'xy-md02',
  // };
  // await client.publish('modbus2mqtt/configure/set', JSON.stringify(payload));
  // console.log('PUBLISHED');
  // const id = 'xfwog';
  // await client.publish('modbus2mqtt/bridge/config/force_remove', id);
}

test();
