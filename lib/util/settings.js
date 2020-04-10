const path = require('path');
const objectAssignDeep = require('object-assign-deep');

const yaml = require('./yaml');
const data = require('./data');

const file = process.env.MODBUS2MQTT_CONFIG || data.joinPath('configuration.yaml');

const defaults = {
  whitelist: [],
  ban: [],
  permit_join: false,
  mqtt: {
    include_device_information: false,
  },
  serial: {
    disable_led: false,
  },
  device_options: {},
  map_options: {
    graphviz: {
      colors: {
        fill: {
          enddevice: '#fff8ce',
          coordinator: '#e04e5d',
          router: '#4ea3e0',
        },
        font: {
          coordinator: '#ffffff',
          router: '#ffffff',
          enddevice: '#000000',
        },
        line: {
          active: '#009900',
          inactive: '#994444',
        },
      },
    },
  },
  experimental: {
    // json or attribute or attribute_and_json
    output: 'json',
  },
  advanced: {
    legacy_api: true,
    log_rotation: true,
    log_output: ['console', 'file'],
    log_directory: path.join(data.getPath(), 'log', '%TIMESTAMP%'),
    log_file: 'log.txt',
    log_level: /* istanbul ignore next */ process.env.DEBUG ? 'debug' : 'info',
    soft_reset_timeout: 0,
    pan_id: 0x1a62,
    ext_pan_id: [0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD],
    channel: 11,
    baudrate: 115200,
    rtscts: true,
    adapter_concurrent: null,

    // Availability timeout in seconds, disabled by default.
    availability_timeout: 0,
    availability_blacklist: [],
    availability_whitelist: [],

    /**
     * Home Assistant requires ALL attributes to be present in ALL MQTT messages send by the device.
     * https://community.home-assistant.io/t/missing-value-with-mqtt-only-last-data-set-is-shown/47070/9
     *
     * Therefore zigbee2mqtt BY DEFAULT caches all values and resend it with every message.
     * advanced.cache_state in configuration.yaml allows to configure this.
     * https://www.zigbee2mqtt.io/configuration/configuration.html
     */
    cache_state: true,

    /**
     * Add a last_seen attribute to mqtt messages, contains date/time of zigbee message arrival
     * "ISO_8601": ISO 8601 format
     * "ISO_8601_local": Local ISO 8601 format (instead of UTC-based)
     * "epoch": milliseconds elapsed since the UNIX epoch
     * "disable": no last_seen attribute (default)
     */
    last_seen: 'disable',

    // Optional: Add an elapsed attribute to MQTT messages, contains milliseconds since the previous msg
    elapsed: false,

    /**
     * https://github.com/Koenkk/zigbee2mqtt/issues/685#issuecomment-449112250
     *
     * Network key will serve as the encryption key of your network.
     * Changing this will require you to repair your devices.
     */
    network_key: [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],

    /**
     * Enables reporting feature
     */
    report: false,

    /**
     * Home Assistant discovery topic
     */
    homeassistant_discovery_topic: 'homeassistant',

    /**
     * Home Assistant status topic
     */
    homeassistant_status_topic: 'hass/status',

    /**
     * Home Assistant legacy triggers, when enabled:
     * - Zigbee2mqt will send an empty 'action' or 'click' after one has been send
     * - A 'sensor_action' and 'sensor_click' will be discoverd
     */
    homeassistant_legacy_triggers: true,

    /**
     * Configurable timestampFormat
     * https://github.com/Koenkk/zigbee2mqtt/commit/44db557a0c83f419d66755d14e460cd78bd6204e
     */
    timestamp_format: 'YYYY-MM-DD HH:mm:ss',
  },
};

let _settings;
let _settingsWithDefaults;

function read() {
  const s = yaml.read(file);

  // Read !secret MQTT username and password if set
  const interpetValue = (value) => {
    const re = /!(.*) (.*)/g;
    const match = re.exec(value);
    if (match) {
      const file = data.joinPath(`${match[1]}.yaml`);
      const key = match[2];
      return yaml.read(file)[key];
    } else {
      return value;
    }
  };

  if (s.mqtt && s.mqtt.user && s.mqtt.password) {
    s.mqtt.user = interpetValue(s.mqtt.user);
    s.mqtt.password = interpetValue(s.mqtt.password);
  }

  if (s.advanced && s.advanced.network_key) {
    s.advanced.network_key = interpetValue(s.advanced.network_key);
  }

  // Read devices/groups configuration from separate file.
  if (typeof s.devices === 'string') {
    const file = data.joinPath(s.devices);
    s.devices = yaml.readIfExists(file) || {};
  }

  if (typeof s.groups === 'string') {
    const file = data.joinPath(s.groups);
    s.groups = yaml.readIfExists(file) || {};
  }

  return s;
}


function get() {
  if (!_settings) {
    _settings = read();
  }

  return _settings;
}

function getWithDefaults() {
  if (!_settingsWithDefaults) {
    _settingsWithDefaults = objectAssignDeep.noMutate(defaults, get());
  }

  if (!_settingsWithDefaults.devices) {
    _settingsWithDefaults.devices = {};
  }

  if (!_settingsWithDefaults.groups) {
    _settingsWithDefaults.groups = {};
  }

  return _settingsWithDefaults;
}


module.exports = {
  get: getWithDefaults,
  read,
};
