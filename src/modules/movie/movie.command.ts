import { Emoji } from '@common/emoji.enum';
import { SuggestionService } from '@modules/suggestion/suggestion.service';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { Context, createCommandGroupDecorator, Subcommand } from 'necord';
import { CurrentState, Phase } from 'src/currentState';
import { getContinueEmbed, getStartEmbed } from './movie.embed';

export const MovieCommandDecorator = createCommandGroupDecorator({
  name: 'movie',
  description: 'Admin Befehle',
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
});

@MovieCommandDecorator()
export class MovieCommand {
  constructor(private readonly suggestionService: SuggestionService) {}

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
}
