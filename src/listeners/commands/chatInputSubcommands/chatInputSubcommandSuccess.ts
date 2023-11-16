import { Listener, LogLevel } from '@sapphire/framework';
import type { Logger } from '@sapphire/plugin-logger';
import { ChatInputSubcommandSuccessPayload } from '@sapphire/plugin-subcommands';
import handleChatInputOrContextMenuCommandSuccess from '../../../lib/utils/functions/successHelper';

export class ChatInputSubcommandSuccessListener extends Listener {
  public run(payload: ChatInputSubcommandSuccessPayload) {
    handleChatInputOrContextMenuCommandSuccess(payload);
  }

  public onLoad() {
    this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
    return super.onLoad();
  }
}
