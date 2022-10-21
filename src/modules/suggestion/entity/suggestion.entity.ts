import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'suggestions' })
export class SuggestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  movieId: number;

  @CreateDateColumn({ name: 'createdAt' })
  readonly createdAt: Date;
}
