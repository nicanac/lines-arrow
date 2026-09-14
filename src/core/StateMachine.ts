import { GameState } from '../types/game.types';

export type StateChangeCallback = (newState: GameState, prevState: GameState) => void;

export class StateMachine {
  private currentState: GameState = GameState.INITIALIZING;
  private listeners: StateChangeCallback[] = [];

  private static readonly VALID_TRANSITIONS: Record<GameState, GameState[]> = {
    [GameState.INITIALIZING]: [GameState.IDLE],
    [GameState.IDLE]: [GameState.RESOLVING, GameState.GAME_OVER, GameState.LEVEL_WON],
    [GameState.RESOLVING]: [GameState.IDLE, GameState.LEVEL_WON, GameState.GAME_OVER],
    [GameState.LEVEL_WON]: [GameState.INITIALIZING, GameState.IDLE],
    [GameState.GAME_OVER]: [GameState.INITIALIZING, GameState.IDLE],
  };

  constructor(initialState: GameState = GameState.INITIALIZING) {
    this.currentState = initialState;
  }

  public getState(): GameState {
    return this.currentState;
  }

  public canTransition(targetState: GameState): boolean {
    const allowed = StateMachine.VALID_TRANSITIONS[this.currentState];
    return allowed ? allowed.includes(targetState) : false;
  }

  public transition(targetState: GameState): boolean {
    if (this.currentState === targetState) return true;

    if (!this.canTransition(targetState)) {
      console.warn(`[StateMachine] Invalid transition from ${this.currentState} to ${targetState}`);
      return false;
    }

    const prev = this.currentState;
    this.currentState = targetState;
    this.notify(targetState, prev);
    return true;
  }

  public forceState(state: GameState): void {
    const prev = this.currentState;
    this.currentState = state;
    this.notify(state, prev);
  }

  public onStateChange(callback: StateChangeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify(newState: GameState, prevState: GameState): void {
    for (const listener of this.listeners) {
      listener(newState, prevState);
    }
  }
}
