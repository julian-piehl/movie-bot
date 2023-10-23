import { container } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import type { EmbedBuilder, TextChannel } from 'discord.js';
import { LogChannelID } from '../constants';

export async function sendToLogWebhook(embed: EmbedBuilder) {
  if (isNullish(LogChannelID)) {
    return;
  }
  let channel = await container.client.channels.fetch(LogChannelID).catch(() => null);

  if (isNullish(channel) || !channel.isTextBased()) {
    container.logger.error('Invalid Log Channel!');
    return;
  }

  channel = channel as TextChannel;

  const webhook = (await channel.fetchWebhooks()).first();

  if (isNullish(webhook) || !webhook.token) {
    container.logger.error("Log Channel doesn't has Webhook!");
    return;
  }

  await webhook.send({ embeds: [embed] });
}
