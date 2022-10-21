import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { catchError, lastValueFrom, map } from 'rxjs';
import { Movie } from './dto/movie.dto';

@Injectable()
export class TMDBService {
  constructor(private readonly httpService: HttpService) {}

  async searchMovie(query: string): Promise<Movie[]> {
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
    return movies;
  }
}
