import { EmbedPager } from '@common/embedPager/embedPager';
import { unvoteButton, voteButton } from '@common/embedPager/pageButton';
import { Emoji } from '@common/emoji.enum';
import { generateMovieEmbed } from '@modules/movie/movie.embed';
import { SuggestionService } from '@modules/suggestion/suggestion.service';
import { Injectable } from '@nestjs/common';
import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { Button, ButtonContext, Context } from 'necord';
import { CurrentState } from 'src/currentState';
import { Movie } from 'src/lib/tmdb/dto/movie.dto';
import { TMDBService } from 'src/lib/tmdb/tmdb.service';
import { VotingService } from './voting.service';

@Injectable()
export class VotingButton {
  constructor(
    private readonly tmdb: TMDBService,
    private readonly suggestionService: SuggestionService,
    private readonly votingService: VotingService,
  ) {}

  @Button('startVote')
  async onVote(@Context() [interaction]: ButtonContext) {
    await interaction.deferReply({ ephemeral: true });

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (
      !member.voice.channelId ||
      member.voice.channelId != CurrentState.movieChannelId
    ) {
      interaction.editReply({
        content:
          Emoji.cross +
          ` Um für Filme abzustimmen musst du dem <#${CurrentState.movieChannelId}> Kanal beitreten.`,
      });
      return;
    }

    const movieIds = await this.suggestionService.getMovieIds();

    const movies = await Promise.all(
      movieIds.map(async (movieId) => {
        return this.tmdb.getMovie(movieId);
      }),
    );

    const embedPager = new EmbedPager<Movie>(movies, generateMovieEmbed);
    embedPager.setStopOnCollect(false);
    embedPager.onPagination(async (data) => {
      const isVoted = await this.votingService.checkVoting(
        interaction.user.id,
        data.id,
      );

      if (process.env.MOVIEBOT_LIMIT_VOTES == 'true') {
        const voteCount = await this.votingService.countByUser(
          interaction.user.id,
        );
        const maxVotes = Math.floor(movies.length / 3) + 1;

        const remainingVotesButton = new ButtonBuilder()
          .setCustomId('placeholder')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
          .setLabel(`< ${maxVotes - voteCount} >`);

        return [
          voteButton.setDisabled(isVoted || voteCount >= maxVotes),
          remainingVotesButton,
          unvoteButton.setDisabled(!isVoted),
        ];
      }

      return [
        voteButton.setDisabled(isVoted),
        unvoteButton.setDisabled(!isVoted),
      ];
    });

    embedPager.run(interaction, async (movie) => {
      await this.votingService.switchVoting(interaction.user.id, movie.id);
    });
  }
}
