import { Emoji } from '@common/emoji.enum';
import { SuggestionService } from '@modules/suggestion/suggestion.service';
import { VotingService } from '@modules/voting/voting.service';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { Context, createCommandGroupDecorator, Subcommand } from 'necord';
import { CurrentState, Phase } from 'src/currentState';
import { TMDBService } from 'src/lib/tmdb/tmdb.service';
import {
  generateMovieEmbed,
  getContinueEmbed,
  getEndEmbed,
  getStartEmbed,
} from './movie.embed';

export const MovieCommandDecorator = createCommandGroupDecorator({
  name: 'movie',
  description: 'Admin Befehle',
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
});

@MovieCommandDecorator()
export class MovieCommand {
  constructor(
    private readonly suggestionService: SuggestionService,
    private readonly votingService: VotingService,
    private readonly tmdbService: TMDBService,
  ) {}

  @Subcommand({
    name: 'start',
    description: 'Startet die Vorschlagphase',
  })
  public async onStart(@Context() [interaction]: [CommandInteraction]) {
    await interaction.deferReply({ ephemeral: true });

    if (CurrentState.phase != Phase.None) {
      interaction.editReply({
        content: Emoji.cross + ' Die Abstimmung läuft bereits!',
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.voice.channelId) {
      interaction.editReply({
        content: Emoji.cross + ' Du musst dich in einem Sprachkanal befinden!',
      });
      return;
    }

    // TODO: Uncomment next line
    // await Promise.all([
    //   this.suggestionService.clear(),
    //   this.votingService.clear(),
    // ]);

    CurrentState.movieChannelId = member.voice.channelId;
    CurrentState.phase = Phase.Suggestions;

    interaction.editReply({
      content: Emoji.check + ' Vorschlagphase gestartet.',
    });

    /*const button = new ButtonBuilder()
      .setCustomId('suggest')
      .setLabel('Jetzt vorschlagen')
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      button,
    );*/

    const suggestionCount = await this.suggestionService.count();
    const message = await interaction.channel.send({
      embeds: [getStartEmbed(suggestionCount)],
      //   components: [actionRow],
    });
    CurrentState.startMessage = message;
  }

  @Subcommand({
    name: 'continue',
    description: 'Startet die Votingphase',
  })
  public async onContinue(@Context() [interaction]: [CommandInteraction]) {
    await interaction.deferReply({ ephemeral: true });

    if (CurrentState.phase != Phase.Suggestions) {
      interaction.editReply({
        content:
          Emoji.cross +
          ' Die Abstimmung befindet sich nicht in der Vorschlagphase!',
      });
      return;
    }
    const suggestionCount = await this.suggestionService.count();
    if (suggestionCount == 0) {
      interaction.editReply({
        content:
          Emoji.cross +
          ' Es wurden noch keine Filme zur Abstimmung vorgeschlagen!',
      });
      return;
    }

    CurrentState.startMessage.delete();
    CurrentState.startMessage = null;
    CurrentState.phase = Phase.Voting;

    interaction.editReply({
      content: Emoji.check + ' Votingphase gestartet.',
    });

    const button = new ButtonBuilder()
      .setCustomId('startVote')
      .setLabel('Jetzt abstimmen')
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      button,
    );

    const message = await interaction.channel.send({
      embeds: [getContinueEmbed()],
      components: [actionRow],
    });
    CurrentState.continueMessage = message;
  }

  @Subcommand({
    name: 'end',
    description: 'Beendet das Voting',
  })
  public async onEnd(@Context() [interaction]: [CommandInteraction]) {
    await interaction.deferReply({ ephemeral: true });

    if (CurrentState.phase != Phase.Voting) {
      interaction.editReply({
        content:
          Emoji.cross +
          ' Die Abstimmung befindet sich nicht in der Votingphase!',
      });
      return;
    }
    const mostVoted = await this.votingService.getMostVoted();
    if (mostVoted.length == 0) {
      interaction.editReply({
        content:
          Emoji.cross + ' Es hat noch niemand hat für einen Film abgestimmt!',
      });
      return;
    }

    if (mostVoted.length > 1) {
      interaction.editReply({
        content:
          Emoji.check +
          ' Es gab mehr als einen Gewinner. Voting wird erneut gestartet!',
      });

      const movieIds = (await this.suggestionService.getMovieIds()).filter(
        (item) => !mostVoted.includes(item),
      );
      await Promise.all([
        movieIds.map(async (movieId) => {
          await this.suggestionService.delete(movieId);
        }),
        this.votingService.clear(),
      ]);

      const button = new ButtonBuilder()
        .setCustomId('startVote')
        .setLabel('Jetzt abstimmen')
        .setStyle(ButtonStyle.Primary);

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        button,
      );

      const message = await interaction.channel.send({
        embeds: [getContinueEmbed()],
        components: [actionRow],
      });
      CurrentState.continueMessage = message;
      return;
    }

    CurrentState.continueMessage.delete();
    CurrentState.continueMessage = null;
    CurrentState.phase = Phase.None;

    interaction.editReply({
      content: Emoji.check + ' Abstimmung beendet.',
    });

    const movie = await this.tmdbService.getMovie(mostVoted[0]);
    interaction.channel.send({
      embeds: [getEndEmbed(), generateMovieEmbed(movie)],
    });
  }
}
