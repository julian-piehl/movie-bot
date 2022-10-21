export enum Phase {
  None,
  Suggestions,
  Voting,
  End,
}

export class CurrentState {
  public static phase = Phase.Suggestions;
}
