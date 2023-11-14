export class Paginated<T> {
  public readonly page: number;
  public readonly results: T[];
  public readonly total_pages: number;
  public readonly total_results: number;
}
