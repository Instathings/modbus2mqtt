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
```

## Topics

### Add a new Modbus device

#### modbus2mqtt/configure/set

Payload:
- id: a unique string for you
- modbus_id: the id of your Modbus device
- baud_rate: the baud rate of your device
- interval: in ms the polling period
- model: the model of your device as described in `modbus-herdsman-converters`

```
{
    id: 'uniqueStringId',
    modbus_id: 1,
    baud_rate: 9600,
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
- ack of a new connected device `{type: 'device_connected', friendly_name: 'uniqueStringId'}`
- ack of a force removed device `{type: 'device_force_removed', friendly_name: 'uniqueStringId'}`

### Acknowledgments

This work is inspired from the awesome work of [Zigbee2MQTT](https://github.com/Koenkk/zigbee2mqtt).

### License
modbus2mqtt is [fair-code](https://faircode.io/) licensed under [**Apache 2.0 with Commons Clause**](https://github.com/Instathings/gate/blob/master/LICENSE.md)


