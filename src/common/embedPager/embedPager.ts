import { EmbedBuilder } from '@discordjs/builders';
import {
  ActionRowBuilder,
  ButtonBuilder,
  CommandInteraction,
  ComponentType,
} from 'discord.js';
import {
  lastButton,
  nextButton,
  PageButtonId,
  selectButton,
} from './pageButton';

export class EmbedPager<T> {
  private readonly data: T[];
  private readonly embedBuilder: (data: T) => EmbedBuilder;

  private currentIndex: number;
  private timeout = 1000 * 60 * 5;
  private ephemeral = true;

  constructor(dataArray: T[], embedBuilder: (data: T) => EmbedBuilder) {
    this.data = dataArray;
    this.embedBuilder = embedBuilder;
  }

  setTimeout(ms: number) {
    this.timeout = ms;
  }

  setEphemeral(value: boolean) {
    this.ephemeral = value;
  }

  async run(
    interaction: CommandInteraction /*| ModalSubmitInteraction*/,
    callback: (data: T) => any,
  ) {
    this.currentIndex = 0;

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      lastButton.setDisabled(true),
      selectButton,
      nextButton.setDisabled(this.data.length <= 1),
    );

    const message = await interaction.reply({
      components: [actionRow],
      embeds: [
        this.embedBuilder(this.data[0]).setFooter({
          text: `Seite 1 von ${this.data.length}`,
        }),
      ],
      ephemeral: this.ephemeral,
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: this.timeout,
    });
    collector.on('collect', (button) => {
      if (button.customId == PageButtonId.Select) {
        collector.stop();
        callback(this.data[this.currentIndex]);

        button.update({
          components: [],
          embeds: [
            this.embedBuilder(this.data[this.currentIndex]).setAuthor({
              name: 'Vorschlag eingereicht',
              iconURL: button.user.avatarURL(),
            }),
          ],
        });

        return;
      }

      button.customId == PageButtonId.Last
        ? (this.currentIndex -= 1)
        : (this.currentIndex += 1);

      const updateActionRow = new ActionRowBuilder<ButtonBuilder>();
      updateActionRow.addComponents(
        lastButton.setDisabled(this.currentIndex == 0),
        selectButton,
        nextButton.setDisabled(this.currentIndex == this.data.length - 1),
      );
      button.update({
        components: [updateActionRow],
        embeds: [
          this.embedBuilder(this.data[this.currentIndex]).setFooter({
            text: `Seite ${this.currentIndex + 1} von ${this.data.length}`,
          }),
        ],
      });
    });
  }
}
