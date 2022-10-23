import { Message } from 'discord.js';

export enum Phase {
  None,
  Suggestions,
  Voting,
}

export class CurrentState {
  public static phase = Phase.None;

  public static movieChannelId: string;
  public static startMessage: Message;
}
