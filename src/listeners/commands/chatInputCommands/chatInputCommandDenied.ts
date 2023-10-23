import { Events, Listener, UserError, type ChatInputCommandDeniedPayload } from '@sapphire/framework';
import { handleChatInputOrContextMenuCommandDenied } from '../../../lib/utils/functions/deniedHelper';

export class ChatInputCommandDenied extends Listener<typeof Events.ChatInputCommandDenied> {
  public run(error: UserError, payload: ChatInputCommandDeniedPayload) {
    return handleChatInputOrContextMenuCommandDenied(error, payload);
  }
}
