import { EmbedBuilder } from '@discordjs/builders';
import { Movie } from 'src/lib/tmdb/dto/movie.dto';

export function generateMovieEmbed(movie: Movie) {
  const embed = new EmbedBuilder()
    .setTitle(movie.title)
    .setDescription(movie.overview.length > 0 ? movie.overview : null)
    .setThumbnail(movie.poster)
    .setImage(movie.backdrop);

  return embed;
}

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

export function getContinueEmbed() {
  return new EmbedBuilder()
    .setTitle('Jetzt abstimmen!')
    .setDescription('Wähle aus den vorgeschlagenen Filmen deine Favoriten.')
    .setImage(
      'https://nbcpalmsprings.com/wp-content/uploads/sites/8/2021/12/BEST-MOVIES-OF-2021.jpeg',
    );
}

export function getEndEmbed() {
  return new EmbedBuilder()
    .setTitle('Die Entscheidung ist gefallen!')
    .setDescription('Hier seht ihr nun den Film des Abends');
}
