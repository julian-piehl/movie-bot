import { SuggestionService } from '@modules/suggestion/suggestion.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'discord.js';
import { Repository } from 'typeorm';
import { VoteEntity } from './entity/vote.entity';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(VoteEntity)
    private readonly voteRepository: Repository<VoteEntity>,

    private readonly suggestionService: SuggestionService,
  ) {}

  async clear() {
    await this.voteRepository.clear();
  }

  async count(): Promise<number> {
    return this.voteRepository.count();
  }

  async countByUser(user: User): Promise<number> {
    return this.voteRepository.countBy({ userId: user.id });
  }

  async checkVoting(user: User, movieId: number): Promise<boolean> {
    const vote = await this.voteRepository.countBy({
      userId: user.id,
      movieId,
    });
    return vote > 0;
  }

  async switchVoting(user: User, movieId: number) {
    const isVoted = await this.checkVoting(user, movieId);

    if (isVoted) {
      await this.voteRepository.delete({ userId: user.id, movieId });
    } else {
      await this.voteRepository.save({ userId: user.id, movieId });
    }
  }

  async getMostVoted(): Promise<number[]> {
    let mostVotedIds = [];
    let mostVotedVotes = 0;

    const movieIds = await this.suggestionService.getMovieIds();

    for (const movieId of movieIds) {
      const votes = await this.voteRepository.countBy({ movieId });

      if (votes == 0 || votes < mostVotedVotes) continue;

      if (votes > mostVotedVotes) {
        mostVotedIds = [];
        mostVotedVotes = votes;
      }
      mostVotedIds.push(movieId);
    }

    return mostVotedIds;
  }
}
