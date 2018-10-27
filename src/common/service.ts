import Container, { Injectable } from './container';

abstract class Service implements Injectable {
  public container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  get log() {
    return this.container.get('log');
  }
}

export default Service;
