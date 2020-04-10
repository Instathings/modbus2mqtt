const _ = require('lodash');

const logger = require('./logger');

class Handler {
  constructor() {
    this.instances = [];
  }

  static getInstance() {
    if (this.instance === undefined) {
      this.instance = new Handler();
    }
    return this.instance;
  }

  add(instance) {
    logger.info(`Handler added instance ${instance.id}`);
    this.instances.push(instance);
  }

  get(id) {
    return this.instances.find((element) => element.id === id);
  }

  remove(id) {
    logger.info(`Handler removed instance ${id}`);
    _.remove(this.instances, (element) => element.id === id);
  }
}

module.exports = Handler;
