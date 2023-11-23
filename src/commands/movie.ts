import { EmbedBuilder } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import {
  canSendAttachments,
  canSendEmbeds,
  canSendMessages,
  isMessageInstance,
  isTextBasedChannel,
} from '@sapphire/discord.js-utilities';
import { CommandOptionsRunTypeEnum, UserError } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { isNullish } from '@sapphire/utilities';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction, PermissionFlagsBits, inlineCode } from 'discord.js';
import { getMovie } from '../lib/tmdb';
import {
  Phase,
  getCurrentPhase,
  getMovieTextChannelId,
  getStatusMessage,
  setCurrentPhase,
  setMovieTextChannelId,
  setMovieVoiceChannelId,
  setStatusMessage,
} from '../lib/utils/currentState';
import { generateMovieEmbed } from '../lib/utils/functions/movieEmbed';

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

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (isNullish(member) || isNullish(member.voice.channelId)) {
      throw new UserError({
        identifier: 'incorrectChannel',
        message: 'Bitte betritt zuerst den Sprachkanal in welchem das Event stattfindet.',
      });
    }

    // Check if Bot can send messages in the text channel
    if (
      !canSendMessages(interaction.channel) ||
      !canSendEmbeds(interaction.channel) ||
      !canSendAttachments(interaction.channel)
    ) {
      this.container.logger.warn(`Cant send messages in channel ${interaction.channelId}`);
      throw new UserError({
        identifier: 'clientPermissionsError',
        message: 'Der Bot hat keine Rechte in diesem Channel zu schreiben!',
      });
    }

    await this.container.prisma.vote.deleteMany();
    await this.container.prisma.suggestion.deleteMany();

    await interaction.editReply('✅ Vorschlagsphase gestartet');
    this.container.logger.debug(`${interaction.user.username} started the suggestion phase.`);

    setMovieVoiceChannelId(member.voice.channelId);
    setMovieTextChannelId(interaction.channelId);
    setCurrentPhase(Phase.Suggestions);

    const embed = new EmbedBuilder()
      .setTitle('Welchen Film möchtest du schauen?')
      .setDescription(`Nutze ${inlineCode('/suggest')} um Filme vorzuschlagen.`);

    const statusMessage = await interaction.channel!.send({
      embeds: [embed],
    });

    if (isMessageInstance(statusMessage)) {
      setStatusMessage(statusMessage);
    } else {
      this.container.logger.warn("Couldn't store start message!");
    }
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
    await this.sendVotingPhaseMessage(interaction);
  }

  public async chatInputEnd(interaction: Subcommand.ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (getCurrentPhase() !== Phase.Voting) {
      throw new UserError({
        identifier: 'incorrectPhase',
        message: 'Die Abstimmung befindet sich nicht in der Votingphase!',
      });
    }

    const mostVotedIds = await this.getMostVotedIds();
    if (mostVotedIds.length === 0) {
      throw new UserError({
        identifier: 'noVotes',
        message: 'Es hat noch niemand für einen Film abgestimmt!',
      });
    }

    if (mostVotedIds.length > 1) {
      await interaction.editReply('Es gab mehr als einen Gewinner. Das Voting geht in eine weitere Runde.');
      this.container.logger.debug(
        `${interaction.user.username} tried to end the voting phase but there were more then one winner.`
      );

      await this.container.prisma.vote.deleteMany();
      await this.container.prisma.suggestion.deleteMany({
        where: {
          NOT: {
            OR: mostVotedIds.map((movieId) => ({ movieId })),
          },
        },
      });

      setCurrentPhase(Phase.Voting);
      await this.sendVotingPhaseMessage(interaction);
      return;
    }

    if (!isNullish(getStatusMessage()) && getStatusMessage().deletable) {
      getStatusMessage().delete();
    }

    setCurrentPhase(Phase.None);
    interaction.editReply('Die Abstimmung wurde beendet.');
    this.container.logger.debug(`${interaction.user.username} ended the voting phase.`);

    const movie = await getMovie(mostVotedIds[0]);

    const embed = new EmbedBuilder()
      .setTitle('Die Entscheidung ist gefallen!')
      .setDescription('Hier seht ihr nun den Film des Abends:');

    const sendChannel = (await this.getSendChannel()) || interaction.channel!;

    sendChannel.send({
      embeds: [embed, generateMovieEmbed(movie)],
    });
  }

  private async getSendChannel() {
    if (!isNullish(getMovieTextChannelId())) {
      const channel = await this.container.client.channels.fetch(getMovieTextChannelId());
      if (!isNullish(channel) && isTextBasedChannel(channel)) {
        return channel;
      }
    }

    this.container.logger.warn('No Text Channel ID provided!');
    return undefined;
  }

  private async sendVotingPhaseMessage(interaction: Interaction) {
    const button = new ButtonBuilder()
      .setCustomId('startVote')
      .setLabel('Jetzt abstimmen')
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const embed = new EmbedBuilder()
      .setTitle('Jetzt abstimmen!')
      .setDescription('Wähle aus den eingereichten Filmen deine Favoriten.');

    if (!isNullish(getStatusMessage()) && getStatusMessage().deletable) {
      getStatusMessage().delete();
    }

    const sendChannel = (await this.getSendChannel()) || interaction.channel!;

    const statusMessage = await sendChannel.send({
      embeds: [embed],
      components: [actionRow],
    });

    if (isMessageInstance(statusMessage)) {
      setStatusMessage(statusMessage);
    } else {
      this.container.logger.warn("Couldn't store continue message!");
    }
  }

  private async getMostVotedIds() {
    const votes = await this.container.prisma.vote
      .groupBy({
        by: ['movieId'],
        _count: {
          userId: true,
        },
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
      })
      .then((result) =>
        result.map((entry) => ({
          moveId: entry.movieId,
          votes: entry._count.userId,
        }))
      );

    let mostVotedIds: number[] = [];
    let mostVotedVotes = 0;
    votes.forEach((entry) => {
      if (entry.votes === 0 || entry.votes < mostVotedVotes) return;

      if (entry.votes > mostVotedVotes) {
        mostVotedIds = [];
        mostVotedVotes = entry.votes;
      }
      mostVotedIds.push(entry.moveId);
    });

    return mostVotedIds;
  }
}
