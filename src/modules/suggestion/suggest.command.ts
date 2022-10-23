import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommandInteraction, EmbedBuilder, User } from 'discord.js';
import { Context, Options, SlashCommand } from 'necord';
import { Repository } from 'typeorm';
import { CurrentState, Phase } from '../../currentState';
import { SuggestCommandDto } from './dto/suggestCommand.dto';
import { SuggestionEntity } from './entity/suggestion.entity';
import { Movie } from '../../lib/tmdb/dto/movie.dto';
import { TMDBService } from '../../lib/tmdb/tmdb.service';
import { EmbedPager } from '@common/embedPager/embedPager';

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
      this.updateSuggestion(interaction.user, selectedMovie);
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

  private async updateSuggestion(user: User, movie: Movie) {
    if (process.env.MOVIEBOT_MULTIPLE_SUGGESTIONS != 'true') {
      await this.suggestionsRepository.delete({
        userId: user.id,
      });
    } else {
      const found = await this.suggestionsRepository.findOneBy({
        userId: user.id,
        movieId: movie.id,
      });

      if (found) return;
    }

    this.suggestionsRepository.save({
      userId: user.id,
      movieId: movie.id,
    });
  }
}
