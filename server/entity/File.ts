import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn } from 'typeorm';

@Entity()
export class File extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  filename!: string;

  @Column()
  path!: string;

  @Column()
  mimetype!: string;

  @Column('bigint')
  size!: number;

  @CreateDateColumn()
  createdAt!: Date;
} 