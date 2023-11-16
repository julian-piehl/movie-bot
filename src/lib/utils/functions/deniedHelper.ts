import type { ChatInputCommandDeniedPayload, ContextMenuCommandDeniedPayload, UserError } from '@sapphire/framework';
import { ChatInputSubcommandDeniedPayload } from '@sapphire/plugin-subcommands';

export function handleChatInputOrContextMenuCommandDenied(
  { context, message: content }: UserError,
  { interaction }: ChatInputCommandDeniedPayload | ChatInputSubcommandDeniedPayload | ContextMenuCommandDeniedPayload
) {
  if (Reflect.get(Object(context), 'silent')) return;

  if (interaction.replied || interaction.deferred) {
    return interaction.editReply({
      content,
      allowedMentions: { users: [interaction.user.id], roles: [] },
    });
  }

  return interaction.reply({
    content,
    allowedMentions: { users: [interaction.user.id], roles: [] },
    ephemeral: true,
  });
}
