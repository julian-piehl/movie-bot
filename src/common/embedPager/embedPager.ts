import { EmbedBuilder } from '@discordjs/builders';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  CommandInteraction,
  ComponentType,
  InteractionCollector,
  InteractionResponse,
  Message,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  lastButton,
  nextButton,
  PageButtonId,
  selectButton,
} from './pageButton';

export class EmbedPager<T> {
  protected readonly data: T[];
  protected readonly embedBuilder: (data: T) => EmbedBuilder;

  protected currentIndex: number;
  protected timeout;
  protected idle = 1000 * 60 * 5;
  protected ephemeral = true;
  protected stopOnCollect = true;
  protected runOnPagination: (data: T) => Promise<ButtonBuilder[]>;

  constructor(dataArray: T[], embedBuilder: (data: T) => EmbedBuilder) {
    this.data = dataArray;
    this.embedBuilder = embedBuilder;
  }

  setTimeout(ms: number) {
    this.timeout = ms;
  }

  setIdle(ms: number) {
    this.idle = ms;
  }

  setEphemeral(value: boolean) {
    this.ephemeral = value;
  }

  setStopOnCollect(value: boolean) {
    this.stopOnCollect = value;
  }

  onPagination(event: (data: T) => Promise<ButtonBuilder[]>) {
    this.runOnPagination = event;
  }

  async run(
    interaction:
      | CommandInteraction
      | ButtonInteraction
      | ModalSubmitInteraction,
    callback: (data: T) => any,
  ) {
    this.currentIndex = 0;

    let buttons: ButtonBuilder[];
    if (this.runOnPagination) {
      buttons = await this.runOnPagination(this.data[0]);
    } else {
      buttons = [selectButton];
    }

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      lastButton.setDisabled(true),
      ...buttons,
      nextButton.setDisabled(this.data.length <= 1),
    );

    const message = await interaction.editReply({
      components: [actionRow],
      embeds: [
        this.embedBuilder(this.data[0]).setFooter({
          text: `Seite 1 von ${this.data.length}`,
        }),
      ],
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: this.timeout,
      idle: this.idle,
    });
    collector.on('collect', async (button) => {
      await button.deferUpdate();
      if (
        button.customId != PageButtonId.Last &&
        button.customId != PageButtonId.Next
      ) {
        await this.onButton(collector, button, callback);
        return;
      }

      button.customId == PageButtonId.Last
        ? (this.currentIndex -= 1)
        : (this.currentIndex += 1);

      this.rerenderEmbed(button);
    });
  }

  protected async onButton(
    collector: InteractionCollector<ButtonInteraction>,
    interaction: ButtonInteraction,
    callback: (data: T) => any,
  ) {
    if (this.setStopOnCollect) collector.stop();

    await callback(this.data[this.currentIndex]);

    if (this.stopOnCollect) {
      await interaction.editReply({
        components: [],
        embeds: [
          this.embedBuilder(this.data[this.currentIndex]).setAuthor({
            name: 'Vorschlag eingereicht',
            iconURL: interaction.user.avatarURL(),
          }),
        ],
      });
    } else {
      this.rerenderEmbed(interaction);
    }
  }

  protected async rerenderEmbed(interaction: ButtonInteraction) {
    let buttons: ButtonBuilder[];
    if (this.runOnPagination) {
      buttons = await this.runOnPagination(this.data[this.currentIndex]);
    } else {
      buttons = [selectButton];
    }
    const updateActionRow = new ActionRowBuilder<ButtonBuilder>();
    updateActionRow.addComponents(
      lastButton.setDisabled(this.currentIndex == 0),
      ...buttons,
      nextButton.setDisabled(this.currentIndex == this.data.length - 1),
    );
    await interaction.editReply({
      components: [updateActionRow],
      embeds: [
        this.embedBuilder(this.data[this.currentIndex]).setFooter({
          text: `Seite ${this.currentIndex + 1} von ${this.data.length}`,
        }),
      ],
    });
  }
}
