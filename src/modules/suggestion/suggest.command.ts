import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import { Context, Options, SlashCommand } from 'necord';
import { Repository } from 'typeorm';
import { CurrentState, Phase } from '../../currentState';
import { SuggestCommandDto } from './dto/suggestCommand.dto';
import { SuggestionEntity } from './entity/suggestion.entity';
import { Movie } from '../../lib/tmdb/dto/movie.dto';
import { TMDBService } from '../../lib/tmdb/tmdb.service';

@Injectable()
export class SuggestCommand {
  constructor(
    private readonly tmdb: TMDBService,

    @InjectRepository(SuggestionEntity)
    private suggestionsRepository: Repository<SuggestionEntity>,
  ) {}

  @SlashCommand({
    name: 'suggest',
    description: 'Schlage einem Film vor.',
    defaultMemberPermissions: PermissionsBitField.Flags.Administrator,
  })
  public async onSuggest(
    @Context() [interaction]: [CommandInteraction],
    @Options() { query }: SuggestCommandDto,
  ) {
    if (CurrentState.phase != Phase.Suggestions) {
      interaction.reply({
        content: '❌ Vorschläge können aktuell nicht eingereicht werden!',
        ephemeral: true,
      });
      return;
    }

    const data = await this.tmdb.searchMovie(query);
    if (data.length <= 0) {
      interaction.reply({
        content: '❌ Der Film konnte nicht gefunden werden.',
        ephemeral: true,
      });
      return;
    }

    console.log(data);

    if (data.length == 1) {
      interaction.reply({
        embeds: [this.generateMovieMessage(data[0])],
        ephemeral: true,
      });
      return;
    }
    const lastButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️')
      .setCustomId('last');
    const selectButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setLabel('Auswählen')
      .setCustomId('select');
    const nextButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('➡️')
      .setCustomId('next');
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      lastButton.setDisabled(true),
      selectButton,
      nextButton,
    );
    const message = await interaction.reply({
      components: [actionRow],
      embeds: [
        this.generateMovieMessage(data[0]).setFooter({
          text: `Seite 1 von ${data.length}`,
        }),
      ],
      ephemeral: true,
    });

    let currentIndex = 0;
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 1000 * 60 * 5,
    });
    collector.on('collect', async (button) => {
      if (button.customId == 'select') {
        collector.stop();

        button.update({
          components: [],
          embeds: [
            this.generateMovieMessage(data[currentIndex]).setAuthor({
              name: 'Vorschlag eingereicht',
              iconURL: interaction.user.avatarURL(),
            }),
          ],
        });

        if (process.env.MOVIEBOT_MULTIPLE_SUGGESTIONS != 'true') {
          await this.suggestionsRepository.delete({
            userId: interaction.user.id,
          });
        } else {
          const found = await this.suggestionsRepository.findOneBy({
            userId: interaction.user.id,
            movieId: data[currentIndex].id,
          });

          if (found) return;
        }

        this.suggestionsRepository.save({
          userId: interaction.user.id,
          movieId: data[currentIndex].id,
        });
        return;
      }

      button.customId == 'last' ? (currentIndex -= 1) : (currentIndex += 1);

      const updateActionRow = new ActionRowBuilder<ButtonBuilder>();
      updateActionRow.addComponents(
        lastButton.setDisabled(currentIndex == 0),
        selectButton,
        nextButton.setDisabled(currentIndex == data.length - 1),
      );
      button.update({
        components: [updateActionRow],
        embeds: [
          this.generateMovieMessage(data[currentIndex]).setFooter({
            text: `Seite ${currentIndex + 1} von ${data.length}`,
          }),
        ],
      });
    });
  }

  private generateMovieMessage(movie: Movie) {
    const embed = new EmbedBuilder()
      .setTitle(movie.title)
      .setDescription(movie.overview.length > 0 ? movie.overview : null)
      .setThumbnail(movie.poster)
      .setImage(movie.backdrop);

    return embed;
  }
}
