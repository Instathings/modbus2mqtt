# modbus2mqtt - software layer to abstract modbus protocol

## Configuration

To start the modbus2mqtt service you will need a `configuration.yaml` in the `data` folder.

### configuration.yaml

Minimal configuration looks like this:

```
mqtt:
  base_topic: modbus2mqtt
  server: 'mqtt://localhost'
modbus:
  port: /dev/tty.SLAB_USBtoUART
  baud_rate: 9600
advanced:
  log_output:
    - console
devices:
  device1:
    modbus_id: 1
    model: xy-md02
```
Note: devices can be added via mqtt as well, see below.

## Running

Start with:
```
npm start
```

Enable debug logging with:
```
DEBUG=1 npm start
```

(recommended the first time to see whats going on)

## Topics

### Add a new Modbus device

#### modbus2mqtt/configure/set

Payload:
- id: a unique string for you
- modbus_id: the id of your Modbus device
- interval: in ms the polling period
- model: the model of your device as described in `modbus-herdsman-converters`

```
{
    id: 'device1',
    modbus_id: 1,
    interval: 10000,
    model: 'xy-md02',
}
```

### Remove a Modbus device

#### modbus2mqtt/bridge/config/force_remove

Payload:
- id: the id of the device to remove

This payload must be sent as a string not as a JSON object.

### Read data of a device

#### modbus2mqtt/:id

You can subscribe to this topic in order to receive data from the device.

### Log

### modbus2mqtt/bridge/log

In this topic are sent:
- ack of a new connected device 
```
{
  type: 'device_connected', 
  message: {
    friendly_name: 'device1'
  }
}
```
- ack of a force removed device 
```
{ 
  type: 'device_force_removed', 
  message: 'device1'
}
```

### Acknowledgments

This work relies on the awesome [modbus-serial](https://github.com/yaacov/node-modbus-serial) library.

This work is inspired from the awesome work of [Zigbee2MQTT](https://github.com/Koenkk/zigbee2mqtt).

### License
modbus2mqtt is [fair-code](https://faircode.io/) licensed under [**Apache 2.0 with Commons Clause**](https://github.com/Instathings/modbus2mqtt/blob/master/LICENSE.md)


