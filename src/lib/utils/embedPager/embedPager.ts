import { EmbedBuilder } from '@discordjs/builders';
import { isNullish } from '@sapphire/utilities';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  CommandInteraction,
  ComponentType,
  InteractionCollector,
  ModalSubmitInteraction,
} from 'discord.js';
import { PageButtonId, lastButton, nextButton, selectButton } from './pageButton';

export class EmbedPager<T> {
  protected readonly data: T[];
  protected readonly embedBuilder: (data: T) => EmbedBuilder;

  protected currentIndex: number;
  protected timeout: number;
  protected idle = 1000 * 60 * 5;
  protected ephemeral = true;
  protected stopOnCollect = true;
  protected runOnPagination: (data: T) => Promise<ButtonBuilder[]>;
  protected attachmentBuilder: (data: T) => Promise<AttachmentBuilder>;

  public constructor(dataArray: T[], embedBuilder: (data: T) => EmbedBuilder) {
    this.data = dataArray;
    this.embedBuilder = embedBuilder;
  }

  public setTimeout(ms: number) {
    this.timeout = ms;
  }

  public setIdle(ms: number) {
    this.idle = ms;
  }

  public setEphemeral(value: boolean) {
    this.ephemeral = value;
  }

  public setStopOnCollect(value: boolean) {
    this.stopOnCollect = value;
  }

  public onPagination(event: (data: T) => Promise<ButtonBuilder[]>) {
    this.runOnPagination = event;
  }

  public setAttachmentBuilder(builder: (data: T) => Promise<AttachmentBuilder>) {
    this.attachmentBuilder = builder;
  }

  public async run(
    interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction,
    callback: (data: T) => any
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
      nextButton.setDisabled(this.data.length <= 1)
    );

    const message = await interaction.editReply({
      components: [actionRow],
      embeds: [
        this.embedBuilder(this.data[0]).setFooter({
          text: `Seite 1 von ${this.data.length}`,
        }),
      ],
      files: isNullish(this.attachmentBuilder) ? [] : [await this.attachmentBuilder(this.data[0])],
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: this.timeout,
      idle: this.idle,
    });
    collector.on('collect', async (button) => {
      await button.deferUpdate();
      if (button.customId !== PageButtonId.Last && button.customId !== PageButtonId.Next) {
        await this.onButton(collector, button, callback);
        return;
      }

      button.customId === PageButtonId.Last ? (this.currentIndex -= 1) : (this.currentIndex += 1);

      await this.rerenderEmbed(button);
    });
  }

  protected async onButton(
    collector: InteractionCollector<ButtonInteraction>,
    interaction: ButtonInteraction,
    callback: (data: T) => any
  ) {
    if (this.stopOnCollect) collector.stop();

    await callback(this.data[this.currentIndex]);

    if (this.stopOnCollect) {
      await interaction.editReply({
        components: [],
        embeds: [
          this.embedBuilder(this.data[this.currentIndex]).setAuthor({
            name: 'Vorschlag eingereicht',
            iconURL: interaction.user.avatarURL() || undefined,
          }),
        ],
      });
    } else {
      await this.rerenderEmbed(interaction);
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
      lastButton.setDisabled(this.currentIndex === 0),
      ...buttons,
      nextButton.setDisabled(this.currentIndex === this.data.length - 1)
    );
    await interaction.editReply({
      components: [updateActionRow],
      embeds: [
        this.embedBuilder(this.data[this.currentIndex]).setFooter({
          text: `Seite ${this.currentIndex + 1} von ${this.data.length}`,
        }),
      ],
      files: isNullish(this.attachmentBuilder) ? [] : [await this.attachmentBuilder(this.data[this.currentIndex])],
    });
  }
}
