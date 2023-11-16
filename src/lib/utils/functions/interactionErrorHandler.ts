import {
  ArgumentError,
  Events,
  InteractionHandlerError,
  InteractionHandlerParseError,
  UserError,
  container,
} from '@sapphire/framework';
import { DiscordAPIError, EmbedBuilder, HTTPError, Interaction, RESTJSONErrorCodes, userMention } from 'discord.js';
import { getWarnError } from './errorHelper';

const UNKNOWN_ERROR_MESSAGE = 'Ein unbekannter Fehler ist aufgetreten.';

export const ignoredCodes = [RESTJSONErrorCodes.UnknownChannel, RESTJSONErrorCodes.UnknownMessage];

export async function handleInteractionError(
  error: Error,
  { handler, interaction }: InteractionHandlerError | InteractionHandlerParseError
) {
  if (typeof error === 'string') return stringError(interaction, error);
  if (error instanceof ArgumentError) return argumentError(interaction, error);
  if (error instanceof UserError) return userError(interaction, error);

  const { client, logger } = container;

  if (error.name === 'AbortError' || error.message === 'Internal Server Error') {
    logger.warn(`${getWarnError(interaction)} (${interaction.user.id}) | ${error.constructor.name}`);
    return alert(interaction, 'Es ist ein Netzwerkfehler aufgetreten. Bitte versuche es erneut!');
  }

  if (error instanceof DiscordAPIError || error instanceof HTTPError) {
    if (ignoredCodes.includes(error.status)) {
      return;
    }
    client.emit(Events.Error, error);
  } else {
    logger.warn(`${getWarnError(interaction)} (${interaction.user.id}) | ${error.constructor.name}`);
  }

  logger.fatal(`[COMMAND] ${handler.location.full}\n${error.stack || error.message}`);
  try {
    await alert(interaction, UNKNOWN_ERROR_MESSAGE);
  } catch (err) {
    client.emit(Events.Error, err as Error);
  }

  return undefined;
}

function stringError(interaction: Interaction, error: string) {
  return alert(interaction, `Ey, ${userMention(interaction.user.id)}, ${error}`);
}

function argumentError(interaction: Interaction, error: ArgumentError<unknown>) {
  return alert(interaction, error.message ?? UNKNOWN_ERROR_MESSAGE);
}

function userError(interaction: Interaction, error: UserError) {
  if (Reflect.get(Object(error.context), 'silent')) return;

  return alert(interaction, error.message ?? UNKNOWN_ERROR_MESSAGE);
}

function alert(interaction: Interaction, content: string) {
  if (!interaction.isAnySelectMenu() && !interaction.isButton()) return;

  const embed = new EmbedBuilder().setDescription(content).setColor('Red');

  if (interaction.replied || interaction.deferred) {
    return interaction.editReply({
      embeds: [embed],
      components: [],
      allowedMentions: { users: [interaction.user.id], roles: [] },
    });
  }

  return interaction.reply({
    embeds: [embed],
    components: [],
    allowedMentions: { users: [interaction.user.id], roles: [] },
    ephemeral: true,
  });
}
