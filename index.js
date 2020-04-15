const semver = require('semver');
const { engines } = require('./package.json');

const version = engines.node;
if (!semver.satisfies(process.version, version)) {
  console.log(`\t\tModbus2mqtt requires node version ${version}, you are running ${process.version}!\n`); // eslint-disable-line
}

const Controller = require('./lib/controller');

const controller = new Controller();
controller.start();
