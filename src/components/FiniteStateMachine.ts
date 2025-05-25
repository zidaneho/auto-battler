// components/FiniteStateMachine.ts
export class FiniteStateMachine<TState extends string> {
  private states: { [key in TState]?: { enter?: () => void; update?: (delta: number) => void; exit?: () => void } };
  private currentState?: TState;

  constructor(states: { [key in TState]?: { enter?: () => void; update?: (delta: number) => void; exit?: () => void } }, initialState: TState) {
    this.states = states;
    this.transition(initialState);
  }

  get state(): TState | undefined {
    return this.currentState;
  }
  addStates(
    newStates: { [key in TState]?: { enter?: () => void; update?: (delta: number) => void; exit?: () => void } }
  ): void {
    for (const key in newStates) {
      this.states[key as TState] = newStates[key as TState];
    }
  }

  transition(state: TState,reset:boolean = false): void {
    const oldState = this.states[this.currentState as TState];
    if (this.currentState === state && !reset) {
      return;
    }
    if (oldState && oldState.exit) {
      oldState.exit.call(this);
    }

    this.currentState = state;
    const newState = this.states[state];
    if (newState && newState.enter) {
      newState.enter.call(this);
    }
  }

  update(delta: number): void {
    const state = this.states[this.currentState as TState];
    if (state && state.update) {
      state.update.call(this, delta);
    }
  }
}