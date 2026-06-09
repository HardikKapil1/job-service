import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
    @InjectQueue('job-queue')
    private readonly jobQueue: Queue,
  ) {}

  async create(createJobDto: CreateJobDto): Promise<Job> {
    // 1. Save to PostgreSQL (status defaults to "pending")
    const jobEntity = this.jobsRepository.create(createJobDto);
    const savedJob = await this.jobsRepository.save(jobEntity);

    // 2. Toss it onto the BullMQ queue!
    await this.jobQueue.add('process-job', savedJob);

    return savedJob;
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobsRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async findAll(): Promise<Job[]> {
    // Fetching all jobs, newest first. We can add pagination later!
    return await this.jobsRepository.find({ order: { createdAt: 'DESC' } });
  }
}
