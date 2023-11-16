import { EmbedBuilder } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandOptionsRunTypeEnum, UserError } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, inlineCode } from 'discord.js';
import { Phase, getCurrentPhase, setCurrentPhase } from '../lib/utils/currentState';

@ApplyOptions<Subcommand.Options>({
  name: 'movie',
  description: 'Admin Befehle',
  subcommands: [
    {
      name: 'start',
      chatInputRun: 'chatInputStart',
    },
    {
      name: 'continue',
      chatInputRun: 'chatInputContinue',
    },
    {
      name: 'end',
      chatInputRun: 'chatInputEnd',
    },
  ],
  requiredUserPermissions: [PermissionFlagsBits.ManageEvents],
  runIn: CommandOptionsRunTypeEnum.GuildAny,
})
export class UserCommand extends Subcommand {
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addSubcommand((command) => command.setName('start').setDescription('Startet die Vorschlagsphase'))
        .addSubcommand((command) => command.setName('continue').setDescription('Startet die Votingphase'))
        .addSubcommand((command) => command.setName('end').setDescription('Beendet das Voting'))
    );
  }

  public async chatInputStart(interaction: Subcommand.ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (getCurrentPhase() !== Phase.None) {
      throw new UserError({
        identifier: 'incorrectPhase',
        message: 'Die Abstimmung läuft bereits!',
      });
    }

    await interaction.editReply('✅ Vorschlagsphase gestartet');
    this.container.logger.debug(`${interaction.user.username} started the suggestion phase.`);

    setCurrentPhase(Phase.Suggestions);

    const embed = new EmbedBuilder()
      .setTitle('Welchen Film möchtest du schauen?')
      .setDescription(`Nutze ${inlineCode('/suggest')} um Filme vorzuschlagen.`);

    await interaction.channel?.send({
      embeds: [embed],
    });
  }

  public async chatInputContinue(interaction: Subcommand.ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (getCurrentPhase() !== Phase.Suggestions) {
      throw new UserError({
        identifier: 'incorrectPhase',
        message: 'Die Abstimmung befindet sich nicht in der Vorschlagsphase!',
      });
    }

    const suggestionCount = await this.container.prisma.suggestion.count();
    if (suggestionCount === 0) {
      throw new UserError({
        identifier: 'noSuggestions',
        message: 'Es wurden noch keine Filme zur Abstimmung eingereicht!',
      });
    }

    await interaction.editReply('✅ Votingphase gestartet.');
    this.container.logger.debug(`${interaction.user.username} started the voting phase.`);

    setCurrentPhase(Phase.Voting);

    const button = new ButtonBuilder()
      .setCustomId('startVote')
      .setLabel('Jetzt abstimmen')
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const embed = new EmbedBuilder()
      .setTitle('Jetzt abstimmen!')
      .setDescription('Wähle aus den eingereichten Filmen deine Favoriten.');

    await interaction.channel?.send({
      embeds: [embed],
      components: [actionRow],
    });
  }

  public async chatInputEnd(interaction: Subcommand.ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (getCurrentPhase() !== Phase.Voting) {
      throw new UserError({
        identifier: 'incorrectPhase',
        message: 'Die Abstimmung befindet sich nicht in der Votingphase!',
      });
    }

    this.container.logger.debug('TODO: Implement "/movie end" logic');
    throw new Error('Command not implemented!');
  }
}
