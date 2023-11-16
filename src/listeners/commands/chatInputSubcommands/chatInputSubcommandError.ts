import { Listener } from '@sapphire/framework';
import { ChatInputSubcommandErrorPayload, SubcommandPluginEvents } from '@sapphire/plugin-subcommands';
import { handleChatInputOrContextMenuCommandError } from '../../../lib/utils/functions/errorHelper';

export class ChatInputSubcommandError extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandError> {
  public run(error: Error, payload: ChatInputSubcommandErrorPayload) {
    return handleChatInputOrContextMenuCommandError(error, payload);
  }
}
