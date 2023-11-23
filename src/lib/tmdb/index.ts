import { plainToInstance } from 'class-transformer';
import { TmdbID } from '../utils/constants';
import { apiGet } from '../utils/functions/api';
import { Movie, MovieDetails } from './movie.model';
import { Paginated } from './paginated.model';

const API_DOMAIN = 'https://api.themoviedb.org/3';

export async function searchMovie(query: string): Promise<Movie[]> {
  const movies = await apiGet<Paginated<Movie>>(
    `${API_DOMAIN}/search/movie?language=de&api_key=${TmdbID}&query=${query}`
  );

  return plainToInstance(Movie, movies.results);
}

export async function getMovie(movieId: number): Promise<MovieDetails> {
  const movie = await apiGet<MovieDetails>(
    `${API_DOMAIN}/movie/${movieId}?append_to_response=watch/providers&language=de&api_key=${TmdbID}`
  );

  return plainToInstance(MovieDetails, movie);
}
