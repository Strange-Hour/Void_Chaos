import { Component } from '../Entity';

export class Player extends Component {
  constructor() {
    super();
  }

  getType(): string {
    return 'player';
  }

  serialize(): object {
    return {};
  }

  deserialize(_: object): void {
    // No data to deserialize
  }
} 