import { Emoji } from '@common/emoji.enum';
import { SuggestionService } from '@modules/suggestion/suggestion.service';
import {
  CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { Context, createCommandGroupDecorator, Subcommand } from 'necord';
import { CurrentState, Phase } from 'src/currentState';

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

    CurrentState.movieChannelId = member.voice.channelId;
    CurrentState.phase = Phase.Suggestions;

    interaction.reply({
      content: Emoji.check + ' Vorschlagphase gestartet.',
      ephemeral: true,
    });

    const embed = new EmbedBuilder()
      .setTitle('Welcher Film möchtest du ansehen?')
      .setDescription(
        'Schlage jetzt einen Film vor!\nNutze dafür einfach den `/suggest` Befehl.',
      )
      .setImage(
        'https://nbcpalmsprings.com/wp-content/uploads/sites/8/2021/12/BEST-MOVIES-OF-2021.jpeg',
      )
      .setFooter({ text: 'Aktuelle Vorschläge: 0' });

    const message = await interaction.channel.send({
      embeds: [embed],
    });
    CurrentState.startMessage = message;
  }
}
