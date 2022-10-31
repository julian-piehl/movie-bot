import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MovieHistoryEntity } from './movieHistory.entity';

@Entity({ name: 'userHistory' })
export class UserHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MovieHistoryEntity, (history) => history.users)
  movie: MovieHistoryEntity;

  @Column()
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }
}
