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
    if (CurrentState.phase != Phase.None) {
      interaction.reply({
        content: Emoji.cross + ' Die Abstimmung läuft bereits!',
        ephemeral: true,
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.voice.channelId) {
      interaction.reply({
        content: Emoji.cross + ' Du musst dich in einem Sprachkanal befinden!',
        ephemeral: true,
      });
      return;
    }

    // await this.suggestionService.clear();
    CurrentState.suggestionCount = 3;

    CurrentState.movieChannelId = member.voice.channelId;
    CurrentState.phase = Phase.Suggestions;

    interaction.reply({
      content: Emoji.check + ' Vorschlagphase gestartet.',
      ephemeral: true,
    });

    /*const button = new ButtonBuilder()
      .setCustomId('suggest')
      .setLabel('Jetzt vorschlagen')
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      button,
    );*/

    const message = await interaction.channel.send({
      embeds: [getStartEmbed(0)],
      //   components: [actionRow],
    });
    CurrentState.startMessage = message;
  }

  @Subcommand({
    name: 'continue',
    description: 'Startet die Votingphase',
  })
  public async onContinue(@Context() [interaction]: [CommandInteraction]) {
    if (CurrentState.phase != Phase.Suggestions) {
      interaction.reply({
        content:
          Emoji.cross +
          ' Die Abstimmung befindet sich nicht in der Vorschlagphase!',
        ephemeral: true,
      });
      return;
    }
    const suggestionCount = await this.suggestionService.count();
    if (suggestionCount == 0) {
      interaction.reply({
        content:
          Emoji.cross +
          ' Es wurden noch keine Filme zur Abstimmung vorgeschlagen!',
        ephemeral: true,
      });
      return;
    }

    CurrentState.startMessage.delete();
    CurrentState.startMessage = null;
    CurrentState.phase = Phase.Voting;

    interaction.reply({
      content: Emoji.check + ' Votingphase gestartet.',
      ephemeral: true,
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
    if (CurrentState.phase != Phase.Voting) {
      interaction.reply({
        content:
          Emoji.cross +
          ' Die Abstimmung befindet sich nicht in der Votingphase!',
        ephemeral: true,
      });
      return;
    }
    const mostVoted = await this.votingService.getMostVoted();
    if (mostVoted.length == 0) {
      interaction.reply({
        content:
          Emoji.cross + ' Es hat noch niemand hat für einen Film abgestimmt!',
        ephemeral: true,
      });
      return;
    }

    if (mostVoted.length > 1) {
      interaction.reply({
        content:
          Emoji.check +
          ' Es gab mehr als einen Gewinner. Voting wird erneut gestartet!',
        ephemeral: true,
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

    interaction.reply({
      content: Emoji.check + ' Abstimmung beendet.',
      ephemeral: true,
    });

    const movie = await this.tmdbService.getMovie(mostVoted[0]);
    interaction.channel.send({
      embeds: [getEndEmbed(), generateMovieEmbed(movie)],
    });
  }
}
