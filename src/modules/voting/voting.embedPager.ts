import {
  ButtonBuilder,
  ButtonInteraction,
  InteractionCollector,
} from 'discord.js';
import { EmbedPager } from '../../common/embedPager/embedPager';
import {
  lastButton,
  nextButton,
  unvoteButton,
  voteButton,
} from '../../common/embedPager/pageButton';

export class VotingEmbedPager<T> extends EmbedPager<T> {
  protected buttons = [voteButton, unvoteButton];

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
