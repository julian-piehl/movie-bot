import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes, UserError } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { AttachmentBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, channelMention } from 'discord.js';
import { readFileSync } from 'fs';
import { getMovie } from '../../lib/tmdb';
import { MovieDetails } from '../../lib/tmdb/movie.model';
import { ImageCachePath, LimitVotes } from '../../lib/utils/constants';
import { Phase, getCurrentPhase, getMovieVoiceChannelId } from '../../lib/utils/currentState';
import { EmbedPager } from '../../lib/utils/embedPager/embedPager';
import { unvoteButton, voteButton } from '../../lib/utils/embedPager/pageButton';
import { generateDetailsMovieEmbed, generateOverviewMovieEmbed } from '../../lib/utils/functions/movieEmbed';

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

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (isNullish(member) || isNullish(member.voice.channelId) || member.voice.channelId !== getMovieVoiceChannelId()) {
      throw new UserError({
        identifier: 'incorrectChannel',
        message: `Bitte betritt den Sprachkanal: ${channelMention(getMovieVoiceChannelId())}.`,
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

    const embedPager = new EmbedPager<MovieDetails>(movies, (movie) => {
      if (isNullish(movie.backdrop) || isNullish(movie.poster)) {
        return generateOverviewMovieEmbed(movie);
      }
      return generateDetailsMovieEmbed(movie);
    });
    embedPager.setAttachmentBuilder(async (movie) => {
      const imageBuffer = readFileSync(`${ImageCachePath}/${movie.id}.jpeg`);
      return new AttachmentBuilder(imageBuffer).setName(`${movie.id}.jpeg`);
    });
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
      const maxVotes = Math.min(Math.floor(movies.length / 3) + 1, 3);

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
