export class Movie {
  private poster_path: string | null;
  overview: string;
  release_date: string;
  genre_ids: number[];
  id: number;
  title: string;
  private backdrop_path: string | null;
  popularity: number;

  constructor(props?: Partial<Movie>) {
    Object.assign(this, props);
  }

  public get poster(): string {
    if (!this.poster_path) return null;
    return 'https://image.tmdb.org/t/p/w342' + this.poster_path;
  }

  public get backdrop(): string {
    if (!this.backdrop_path) return null;
    return 'https://image.tmdb.org/t/p/w780' + this.backdrop_path;
  }
}
