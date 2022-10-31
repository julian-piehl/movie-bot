import { HistoryModule } from '@modules/history/history.module';
import { SuggestionModule } from '@modules/suggestion/suggestion.module';
import { VotingModule } from '@modules/voting/voting.module';
import { Module } from '@nestjs/common';
import { TMDBModule } from 'src/lib/tmdb/tmdb.module';
import { MovieCommand } from './movie.command';

@Module({
  imports: [SuggestionModule, VotingModule, TMDBModule, HistoryModule],
  providers: [MovieCommand],
  exports: [],
})
export class MovieModule {}
