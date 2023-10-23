import { Listener, LogLevel, type ChatInputCommandSuccessPayload } from '@sapphire/framework';
import type { Logger } from '@sapphire/plugin-logger';
import handleChatInputOrContextMenuCommandSuccess from '../../../lib/utils/functions/successHelper';

export class ChatInputCommandSuccessListener extends Listener {
  public run(payload: ChatInputCommandSuccessPayload) {
    handleChatInputOrContextMenuCommandSuccess(payload);
  }

  public onLoad() {
    this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
    return super.onLoad();
  }
}
