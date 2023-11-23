import { Type } from 'class-transformer';
import { Genre } from './genre.model';
import { WatchProviders } from './watchProvider.model';

export class Movie {
  public overview: string;
  public release_date: string;
  public id: number;
  public title: string;
  public popularity: number;

  private poster_path: string | null;
  private backdrop_path: string | null;

  public get poster(): string | null {
    if (!this.poster_path) return null;
    return `https://image.tmdb.org/t/p/w500${this.poster_path}`;
  }

  public get backdrop(): string | null {
    if (!this.backdrop_path) return null;
    return `https://image.tmdb.org/t/p/w1280${this.backdrop_path}`;
  }
}

export class MovieDetails extends Movie {
  genres: Genre[];

  runtime: number;

  vote_average: number;

  @Type(() => WatchProviders)
  'watch/providers': WatchProviders;
}
