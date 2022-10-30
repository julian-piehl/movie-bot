import { HttpService } from '@nestjs/axios';
import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { catchError, lastValueFrom, map } from 'rxjs';
import { Movie } from './dto/movie.dto';

@Injectable()
export class TMDBService {
  constructor(
    private readonly httpService: HttpService,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async searchMovie(query: string): Promise<Movie[]> {
    const cacheValue = await this.cacheManager.get<Movie[]>(
      `tmdb:search:${query}`,
    );
    if (cacheValue) return cacheValue;

    const request = this.httpService
      .get('/search/movie', {
        params: {
          api_key: process.env.TMDB_TOKEN,
          language: 'de',
          query: query,
        },
      })
      .pipe(map((res) => res.data?.results.map((x) => new Movie(x))))
      .pipe(
        catchError(() => {
          throw new ServiceUnavailableException('API not available');
        }),
      );

    const movies = await lastValueFrom<Movie[]>(request);
    this.cacheManager.set(`tmdb:search:${query}`, movies);
    return movies;
  }

  async getMovie(movieId: number): Promise<Movie> {
    const cacheValue = await this.cacheManager.get<Movie>(
      `tmdb:movie:${movieId}`,
    );
    if (cacheValue) return cacheValue;

    const request = this.httpService
      .get(`/movie/${movieId}`, {
        params: {
          api_key: process.env.TMDB_TOKEN,
          language: 'de',
        },
      })
      .pipe(map((res) => new Movie(res.data)))
      .pipe(
        catchError(() => {
          throw new ServiceUnavailableException('API not available');
        }),
      );

    const movie = await lastValueFrom<Movie>(request);
    this.cacheManager.set(`tmdb:movie:${movieId}`, movie);
    return movie;
  }
}
