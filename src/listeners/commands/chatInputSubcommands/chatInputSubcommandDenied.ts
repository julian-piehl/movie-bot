import { Listener, UserError } from '@sapphire/framework';
import { ChatInputSubcommandDeniedPayload, SubcommandPluginEvents } from '@sapphire/plugin-subcommands';
import { handleChatInputOrContextMenuCommandDenied } from '../../../lib/utils/functions/deniedHelper';

export class ChatInputSubcommandDenied extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandDenied> {
  public run(error: UserError, payload: ChatInputSubcommandDeniedPayload) {
    return handleChatInputOrContextMenuCommandDenied(error, payload);
  }
}
