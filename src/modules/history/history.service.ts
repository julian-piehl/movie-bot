import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'discord.js';
import { Movie } from 'src/lib/tmdb/dto/movie.dto';
import { Repository } from 'typeorm';
import { MovieHistoryEntity } from './entity/movieHistory.entity';
import { UserHistoryEntity } from './entity/userHistory.entity';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectRepository(MovieHistoryEntity)
    private readonly movieHistoryRepository: Repository<MovieHistoryEntity>,

    @InjectRepository(UserHistoryEntity)
    private readonly userHistoryRepository: Repository<UserHistoryEntity>,
  ) {}

  async save(movie: Movie, users: User[]) {
    await this.movieHistoryRepository.save({
      title: movie.title,
      tmdbId: movie.id,
      users: users.map((user) => new UserHistoryEntity(user.id)),
    });
    this.logger.log(`Todays movie is "${movie.title}" (${movie.id}).`);
  }
}
