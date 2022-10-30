import { Injectable } from '@nestjs/common';
import {
  ActionRowBuilder,
  CommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Button, ButtonContext, Context, Options, SlashCommand } from 'necord';
import { CurrentState, Phase } from '../../currentState';
import { SuggestCommandDto } from './dto/suggestCommand.dto';
import { Emoji } from '@common/emoji.enum';
import { TMDBService } from 'src/lib/tmdb/tmdb.service';
import { SuggestionService } from './suggestion.service';
import { EmbedPager } from '@common/embedPager/embedPager';
import { Movie } from 'src/lib/tmdb/dto/movie.dto';
import { generateMovieEmbed, getStartEmbed } from '@modules/movie/movie.embed';

@Injectable()
export class SuggestCommand {
  constructor(
    private readonly tmdb: TMDBService,
    private readonly suggestionService: SuggestionService,
  ) {}

  @SlashCommand({
    name: 'suggest',
    description: 'Schlage einem Film vor.',
  })
  public async onSuggest(
    @Context() [interaction]: [CommandInteraction],
    @Options() { query }: SuggestCommandDto,
  ) {
    await interaction.deferReply({ ephemeral: true });

    if (CurrentState.phase != Phase.Suggestions) {
      interaction.editReply({
        content:
          Emoji.cross + ' Vorschläge können aktuell nicht eingereicht werden!',
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (
      !member.voice.channelId ||
      member.voice.channelId != CurrentState.movieChannelId
    ) {
      interaction.editReply({
        content:
          Emoji.cross +
          ` Um Filme vorzuschlagen musst du dem <#${CurrentState.movieChannelId}> Kanal beitreten.`,
      });
      return;
    }

    this.suggestSelector(interaction, query);
  }

  @Button('suggest')
  public async onButton(@Context() [interaction]: ButtonContext) {
    if (CurrentState.phase != Phase.Suggestions) {
      interaction.reply({
        content:
          Emoji.cross + ' Vorschläge können aktuell nicht eingereicht werden!',
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId('suggestModal')
      .setTitle('Jetzt vorschlagen');

    const suggestInput = new TextInputBuilder()
      .setCustomId('suggestInput')
      .setLabel('Name des Filmes:')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Klaus')
      .setMaxLength(100);
    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      suggestInput,
    );

    modal.addComponents(actionRow);

    await interaction.showModal(modal);

    const submitted: ModalSubmitInteraction = await interaction
      .awaitModalSubmit({
        time: 1000 * 60,
        filter: (i) => i.user.id == interaction.user.id,
      })
      .catch((error) => {
        console.log(error);
        return null;
      });

    if (submitted) {
      await submitted.deferReply({ ephemeral: true });
      const movieTitle = submitted.fields.getTextInputValue('suggestInput');
      this.suggestSelector(submitted, movieTitle);
    }
  }

  async suggestSelector(
    interaction: CommandInteraction | ModalSubmitInteraction,
    title: string,
  ) {
    const data = await this.tmdb.searchMovie(title);
    if (data.length <= 0) {
      interaction.editReply({
        content: Emoji.cross + ' Der Film konnte nicht gefunden werden.',
      });
      return;
    }

    const embedPager = new EmbedPager<Movie>(data, generateMovieEmbed);
    embedPager.run(interaction, async (selectedMovie) => {
      await this.suggestionService.update(interaction.user, selectedMovie);
      const suggestionCount = await this.suggestionService.count();

      CurrentState.startMessage.edit({
        embeds: [getStartEmbed(suggestionCount)],
      });
    });
  }
}
