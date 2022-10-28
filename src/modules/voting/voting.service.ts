import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoteEntity } from './entity/vote.entity';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(VoteEntity)
    private readonly voteRepository: Repository<VoteEntity>,
  ) {}

  async checkVoting(userId: string, movieId: number): Promise<boolean> {
    const vote = await this.voteRepository.countBy({ userId, movieId });
    return vote > 0;
  }

  async switchVoting(userId: string, movieId: number) {
    const isVoted = await this.checkVoting(userId, movieId);

    if (isVoted) {
      await this.voteRepository.delete({ userId, movieId });
    } else {
      await this.voteRepository.save({ userId, movieId });
    }
  }
}
