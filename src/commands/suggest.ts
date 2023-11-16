import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum, UserError } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { EmbedBuilder } from 'discord.js';
import { searchMovie } from '../lib/tmdb';
import { Movie } from '../lib/tmdb/movie.model';
import { Phase, getCurrentPhase } from '../lib/utils/currentState';
import { EmbedPager } from '../lib/utils/embedPager/embedPager';

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

    const movies = await searchMovie(interaction.options.getString('title')!);

    if (movies.length <= 0) {
      throw new UserError({
        identifier: 'InvalidMovie',
        message: 'Der Film konnte nicht gefunden werden.',
      });
    }

    const embedPager = new EmbedPager<Movie>(movies, (movie: Movie) => {
      const embed = new EmbedBuilder()
        .setTitle(movie.title)
        .setDescription(movie.overview.length > 0 ? movie.overview : null)
        .setThumbnail(movie.poster)
        .setImage(movie.backdrop);

      return embed;
    });

    void embedPager.run(interaction, async (selectedMovie) => {
      this.container.logger.debug(selectedMovie);

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
