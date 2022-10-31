import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieHistoryEntity } from './entity/movieHistory.entity';
import { UserHistoryEntity } from './entity/userHistory.entity';
import { HistoryService } from './history.service';

@Module({
  imports: [TypeOrmModule.forFeature([MovieHistoryEntity, UserHistoryEntity])],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
