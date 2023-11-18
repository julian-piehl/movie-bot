export enum Phase {
  None,
  Suggestions,
  Voting,
}

let currentPhase = Phase.None;
let movieChannelId: string;

export function getCurrentPhase() {
  return currentPhase;
}

export function setCurrentPhase(phase: Phase) {
  currentPhase = phase;
}

export function getMovieChannelId() {
  return movieChannelId;
}

export function setMovieChannelId(id: string) {
  movieChannelId = id;
}
