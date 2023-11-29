import { HistoryState } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { EmbedBuilder, strikethrough, time } from 'discord.js';
import { getMovie } from '../lib/tmdb';

@ApplyOptions<Command.Options>({
  description: 'Zeig den Filmverlauf',
  runIn: CommandOptionsRunTypeEnum.GuildAny,
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder().setTitle('Filmverlauf');

    const historyArray = await this.container.prisma.history.findMany();
    for (var i = 0; i < historyArray.length; i++) {
      const movie = await getMovie(historyArray[i].movieId);

      const title = `${historyArray[i].id}. ${movie.title}`;

      embed.addFields({
        name: historyArray[i].state === HistoryState.Watched ? title : strikethrough(title),
        value: time(historyArray[i].watchedAt),
      });
    }

    await interaction.editReply({
      embeds: [embed],
    });
  }
}
