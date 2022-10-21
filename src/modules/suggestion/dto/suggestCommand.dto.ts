import { StringOption } from 'necord';

export class SuggestCommandDto {
  @StringOption({
    name: 'title',
    description: 'Titel des Filmes, welchen du vorschlagen möchtest.',
    required: true,
  })
  query: string;
}
