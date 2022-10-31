import {
  ButtonBuilder,
  ButtonInteraction,
  InteractionCollector,
} from 'discord.js';
import { EmbedPager } from '../../common/embedPager/embedPager';

export class VotingEmbedPager<T> extends EmbedPager<T> {
  protected async onButton(
    collector: InteractionCollector<ButtonInteraction>,
    interaction: ButtonInteraction,
    callback: (data: T) => any,
  ) {
    await callback(this.data[this.currentIndex]);

    await this.rerenderEmbed(interaction);

    // interaction.update({
    //   components: [],
    //   embeds: [
    //     this.embedBuilder(this.data[this.currentIndex]).setAuthor({
    //       name: 'Vorschlag eingereicht',
    //       iconURL: interaction.user.avatarURL(),
    //     }),
    //   ],
    // });
  }
}
