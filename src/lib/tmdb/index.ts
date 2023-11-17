import { TmdbID } from '../utils/constants';
import { apiGet } from '../utils/functions/api';
import { Movie } from './movie.model';
import { Paginated } from './paginated.model';

const API_DOMAIN = 'https://api.themoviedb.org/3/';

export async function searchMovie(query: string): Promise<Movie[]> {
  const movies = await apiGet<Paginated<Movie>>(
    `${API_DOMAIN}/search/movie?language=de&api_key=${TmdbID}&query=${query}`
  );

  return movies.results.map((x) => new Movie(x));
}

export async function getMovie(movieId: number): Promise<Movie> {
  const movie = await apiGet<Movie>(`${API_DOMAIN}/movie/${movieId}?language=de&api_key=${TmdbID}`);

  return new Movie(movie);
}
