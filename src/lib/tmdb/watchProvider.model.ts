import { Type } from 'class-transformer';

export class WatchProviders {
  @Type(() => WatchProviderRegions)
  results: WatchProviderRegions;
}

export class WatchProviderRegions {
  @Type(() => WatchProviderResult)
  DE: WatchProviderResult;
}

export class WatchProviderResult {
  link: string;

  @Type(() => WatchProvider)
  flatrate: WatchProvider[];
}

export class WatchProvider {
  public provider_id: number;
  public provider_name: string;
  public display_priority: number;

  private logo_path: string;

  public get logo(): string | null {
    if (!this.logo_path) return null;
    return `https://image.tmdb.org/t/p/original${this.logo_path}`;
  }
}
