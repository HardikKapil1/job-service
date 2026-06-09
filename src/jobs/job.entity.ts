import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ type: 'jsonb', nullable: true })
  result!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}
