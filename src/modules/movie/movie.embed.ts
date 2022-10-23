import { EmbedBuilder } from '@discordjs/builders';

export function getStartEmbed(suggestionCount: number) {
  return new EmbedBuilder()
    .setTitle('Welchen Film möchtest du ansehen?')
    .setDescription(
      'Schlage jetzt einen Film vor!\nNutze dafür einfach den `/suggest` Befehl.',
    )
    .setImage(
      'https://nbcpalmsprings.com/wp-content/uploads/sites/8/2021/12/BEST-MOVIES-OF-2021.jpeg',
    )
    .setFooter({ text: `Aktuelle Vorschläge: ${suggestionCount}` });
}
