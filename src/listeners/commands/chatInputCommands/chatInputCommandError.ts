import { Listener, type ChatInputCommandErrorPayload, type Events } from '@sapphire/framework';
import { handleChatInputOrContextMenuCommandError } from '../../../lib/utils/functions/errorHelper';

export class ChatInputCommandError extends Listener<typeof Events.ChatInputCommandError> {
  public run(error: Error, payload: ChatInputCommandErrorPayload) {
    return handleChatInputOrContextMenuCommandError(error, payload);
  }
}
