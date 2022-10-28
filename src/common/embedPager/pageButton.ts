import { ButtonBuilder, ButtonStyle } from 'discord.js';

export enum PageButtonId {
  Last = 'last',
  Next = 'next',

  Select = 'select',

  Vote = 'vote',
  Unvote = 'unvote',
}

export const lastButton = new ButtonBuilder()
  .setStyle(ButtonStyle.Secondary)
  .setEmoji('⬅️')
  .setCustomId(PageButtonId.Last);
export const nextButton = new ButtonBuilder()
  .setStyle(ButtonStyle.Secondary)
  .setEmoji('➡️')
  .setCustomId(PageButtonId.Next);

export const selectButton = new ButtonBuilder()
  .setStyle(ButtonStyle.Primary)
  .setLabel('Auswählen')
  .setCustomId(PageButtonId.Select);

export const voteButton = new ButtonBuilder()
  .setStyle(ButtonStyle.Success)
  .setLabel('Voten')
  .setCustomId(PageButtonId.Vote);
export const unvoteButton = new ButtonBuilder()
  .setStyle(ButtonStyle.Danger)
  .setLabel('Vote entfernen')
  .setCustomId(PageButtonId.Unvote)
  .setDisabled(true);
