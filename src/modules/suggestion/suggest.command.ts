import { Injectable } from '@nestjs/common';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { Context, Options, SlashCommand } from 'necord';
import { CurrentState, Phase } from '../../currentState';
import { SuggestCommandDto } from './dto/suggestCommand.dto';
import { Movie } from '../../lib/tmdb/dto/movie.dto';
import { TMDBService } from '../../lib/tmdb/tmdb.service';
import { EmbedPager } from '@common/embedPager/embedPager';
import { Emoji } from '@common/emoji.enum';
import { SuggestionService } from './suggestion.service';

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
    if (CurrentState.phase != Phase.Suggestions) {
      interaction.reply({
        content:
          Emoji.cross + ' Vorschläge können aktuell nicht eingereicht werden!',
        ephemeral: true,
      });
      return;
    }

    const data = await this.tmdb.searchMovie(query);
    if (data.length <= 0) {
      interaction.reply({
        content: Emoji.cross + ' Der Film konnte nicht gefunden werden.',
        ephemeral: true,
      });
      return;
    }

    //TODO: Remove me
    console.log(data);

    const embedPager = new EmbedPager<Movie>(data, this.generateMovieMessage);
    embedPager.run(interaction, (selectedMovie) => {
      this.suggestionService.update(interaction.user, selectedMovie);
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
