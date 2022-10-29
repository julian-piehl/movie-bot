import { SuggestionModule } from '@modules/suggestion/suggestion.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TMDBModule } from 'src/lib/tmdb/tmdb.module';
import { VoteEntity } from './entity/vote.entity';
import { VotingButton } from './voting.button';
import { VotingService } from './voting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VoteEntity]),
    SuggestionModule,
    TMDBModule,
  ],
  providers: [VotingButton, VotingService],
  exports: [VotingService],
})
export class VotingModule {}
