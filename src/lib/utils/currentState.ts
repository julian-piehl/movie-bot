import { Message } from 'discord.js';

export enum Phase {
  None,
  Suggestions,
  Voting,
}

let currentPhase = Phase.None;
let movieVoiceChannelId: string;
let movieTextChannelId: string;
let statusMessage: Message;

export function getCurrentPhase() {
  return currentPhase;
}
export function setCurrentPhase(phase: Phase) {
  currentPhase = phase;
}

export function getMovieVoiceChannelId() {
  return movieVoiceChannelId;
}
export function setMovieVoiceChannelId(id: string) {
  movieVoiceChannelId = id;
}

export function getMovieTextChannelId() {
  return movieTextChannelId;
}
export function setMovieTextChannelId(id: string) {
  movieTextChannelId = id;
}

export function getStatusMessage() {
  return statusMessage;
}
export function setStatusMessage(message: Message) {
  statusMessage = message;
}
