export class Movie {
  public overview: string;
  public release_date: string;
  public genre_ids: number[];
  public id: number;
  public title: string;
  public popularity: number;

  private poster_path: string | null;
  private backdrop_path: string | null;

  public constructor(props?: Partial<Movie>) {
    Object.assign(this, props);
  }

  public get poster(): string | null {
    if (!this.poster_path) return null;
    return `https://image.tmdb.org/t/p/w342${this.poster_path}`;
  }

  public get backdrop(): string | null {
    if (!this.backdrop_path) return null;
    return `https://image.tmdb.org/t/p/w780${this.backdrop_path}`;
  }
}
