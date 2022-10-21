import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TMDBModule } from 'src/lib/tmdb/tmdb.module';
import { SuggestionEntity } from './entity/suggestion.entity';
import { SuggestCommand } from './suggest.command';

@Module({
  imports: [TypeOrmModule.forFeature([SuggestionEntity]), TMDBModule],
  providers: [SuggestCommand],
  exports: [],
})
export class SuggestionModule {}
