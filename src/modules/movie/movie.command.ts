import { Emoji } from '@common/emoji.enum';
import { SuggestionService } from '@modules/suggestion/suggestion.service';
import { CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Context, createCommandGroupDecorator, Subcommand } from 'necord';
import { CurrentState, Phase } from 'src/currentState';
import { getStartEmbed } from './movie.embed';

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

    await this.suggestionService.clear();
    CurrentState.suggestionCount = 0;

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
}
