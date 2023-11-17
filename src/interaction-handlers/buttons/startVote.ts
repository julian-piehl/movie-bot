import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes, UserError } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { getMovie } from '../../lib/tmdb';
import { Movie } from '../../lib/tmdb/movie.model';
import { LimitVotes } from '../../lib/utils/constants';
import { Phase, getCurrentPhase } from '../../lib/utils/currentState';
import { EmbedPager } from '../../lib/utils/embedPager/embedPager';
import { unvoteButton, voteButton } from '../../lib/utils/embedPager/pageButton';
import { generateMovieEmbed } from '../../lib/utils/functions/movieEmbed';

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class ButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'startVote') return this.none();

    return this.some();
  }

  public async run(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (getCurrentPhase() !== Phase.Voting) {
      throw new UserError({
        identifier: 'incorrectPhase',
        message: 'Aktuell kann nicht abgestimmt werden!',
      });
    }

    const movieIds = (await this.container.prisma.suggestion.findMany({ select: { movieId: true } })).map(
      (entry) => entry.movieId
    );

    const movies = await Promise.all(
      movieIds.map(async (movieId) => {
        return getMovie(movieId);
      })
    );

    const embedPager = new EmbedPager<Movie>(movies, generateMovieEmbed);
    embedPager.setStopOnCollect(false);
    embedPager.onPagination(async (data) => {
      const isVoted = await this.container.prisma.vote
        .findFirst({
          where: { userId: interaction.user.id, movieId: data.id },
        })
        .then((vote) => !isNullish(vote));

      if (!LimitVotes) {
        return [voteButton.setDisabled(isVoted), unvoteButton.setDisabled(!isVoted)];
      }

      const voteCount = await this.container.prisma.vote.count({ where: { userId: interaction.user.id } });
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
    });

    embedPager.run(interaction, async (movie) => {
      if (getCurrentPhase() !== Phase.Voting) return;

      const isVoted = await this.container.prisma.vote
        .findFirst({
          where: { userId: interaction.user.id, movieId: movie.id },
        })
        .then((vote) => !isNullish(vote));

      if (isVoted) {
        await this.container.prisma.vote.delete({
          where: { userId_movieId: { userId: interaction.user.id, movieId: movie.id } },
        });
      } else {
        await this.container.prisma.vote.create({
          data: {
            userId: interaction.user.id,
            movieId: movie.id,
          },
        });
      }
    });
  }
}
