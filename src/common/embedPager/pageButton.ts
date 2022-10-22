import { ButtonBuilder, ButtonStyle } from 'discord.js';

export enum PageButtonId {
  Last = 'last',
  Select = 'select',
  Next = 'next',
}

export const lastButton = new ButtonBuilder()
  .setStyle(ButtonStyle.Secondary)
  .setEmoji('⬅️')
  .setCustomId(PageButtonId.Last);
export const selectButton = new ButtonBuilder()
  .setStyle(ButtonStyle.Primary)
  .setLabel('Auswählen')
  .setCustomId(PageButtonId.Select);
export const nextButton = new ButtonBuilder()
  .setStyle(ButtonStyle.Secondary)
  .setEmoji('➡️')
  .setCustomId(PageButtonId.Next);
