import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum, UserError } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { channelMention } from 'discord.js';
import { searchMovie } from '../lib/tmdb';
import { Movie } from '../lib/tmdb/movie.model';
import { Phase, getCurrentPhase, getMovieChannelId } from '../lib/utils/currentState';
import { EmbedPager } from '../lib/utils/embedPager/embedPager';
import { generateMovieEmbed } from '../lib/utils/functions/movieEmbed';

@ApplyOptions<Command.Options>({
  description: 'Schlage einen Film vor.',
  runIn: CommandOptionsRunTypeEnum.GuildAny,
})
export class SuggestCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) => option.setName('title').setDescription('Filmtitel').setRequired(true))
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (getCurrentPhase() !== Phase.Suggestions) {
      throw new UserError({
        identifier: 'incorrectPhase',
        message: 'Vorschläge können aktuell nicht eingereicht werden!',
      });
    }

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (isNullish(member) || isNullish(member.voice.channelId) || member.voice.channelId !== getMovieChannelId()) {
      throw new UserError({
        identifier: 'incorrectChannel',
        message: `Bitte betritt den Sprachkanal: ${channelMention(getMovieChannelId())}.`,
      });
    }

    const movies = await searchMovie(interaction.options.getString('title')!);

    if (movies.length <= 0) {
      throw new UserError({
        identifier: 'InvalidMovie',
        message: 'Der Film konnte nicht gefunden werden.',
      });
    }

    const embedPager = new EmbedPager<Movie>(movies, (movie: Movie) => {
      const embed = generateMovieEmbed(movie);

      return embed;
    });

    void embedPager.run(interaction, async (selectedMovie) => {
      const suggestion = await this.container.prisma.suggestion.findFirst({
        where: { movieId: selectedMovie.id, userId: interaction.user.id },
      });

      if (!isNullish(suggestion)) return;

      await this.container.prisma.suggestion.create({
        data: {
          movieId: selectedMovie.id,
          userId: interaction.user.id,
        },
      });

      this.container.logger.debug(`${interaction.user.username} suggested "${selectedMovie.title}"`);
    });
  }
}
