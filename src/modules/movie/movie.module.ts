import { SuggestionModule } from '@modules/suggestion/suggestion.module';
import { Module } from '@nestjs/common';
import { MovieCommand } from './movie.command';

@Module({
  imports: [SuggestionModule],
  providers: [MovieCommand],
  exports: [],
})
export class MovieModule {}
