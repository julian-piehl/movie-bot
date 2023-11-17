import { EmbedBuilder } from 'discord.js';
import { Movie } from '../../tmdb/movie.model';

export function generateMovieEmbed(movie: Movie) {
  return new EmbedBuilder()
    .setTitle(movie.title)
    .setDescription(movie.overview.length > 0 ? movie.overview : null)
    .setThumbnail(movie.poster)
    .setImage(movie.backdrop);
}
