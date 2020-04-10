# modbus2mqtt - software layer to abstract modbus protocol

## Topics

### Add a new Modbus device

#### modbus2mqtt/configure/set

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

#### modbus2mqtt/configure/unset

Payload:
- id: the id of the device to remove

```
{
    id: 'uniqueStringId',
}
```

### Read data of a device

#### modbus2mqtt/:id

You can subscribe to this topic in order to receive data from the device.

### License
gate is [fair-code](https://faircode.io/) licensed under [**Apache 2.0 with Commons Clause**](https://github.com/Instathings/gate/blob/master/LICENSE.md)


