export enum Phase {
  None,
  Suggestions,
  Voting,
}

let currentPhase = Phase.None;

export function getCurrentPhase() {
  return currentPhase;
}

export function setCurrentPhase(phase: Phase) {
  currentPhase = phase;
}
