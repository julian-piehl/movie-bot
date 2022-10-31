import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserHistoryEntity } from './userHistory.entity';

@Entity({ name: 'movieHistory' })
export class MovieHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  tmdbId: number;

  @OneToMany(() => UserHistoryEntity, (userHistory) => userHistory.movie, {
    cascade: true,
  })
  users: UserHistoryEntity[];

  @CreateDateColumn()
  readonly createdAt: Date;
}
