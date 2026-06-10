import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
    @InjectQueue('job-queue')
    private readonly jobQueue: Queue,
    @Inject('CACHE_MANAGER')
    private readonly cacheManager: Cache,
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
    const cacheKey = `job:${id}`;

    // 1. Check Redis first!
    const cachedJob = await this.cacheManager.get<Job>(cacheKey);
    if (cachedJob) {
      console.log(`Returning job ${id} from Redis Cache!`);
      return cachedJob;
    }

    // 2. If not in cache, query PostgreSQL
    console.log(`Cache miss! Fetching job ${id} from PostgreSQL...`);
    const job = await this.jobsRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    // 3. Save the result to Redis so the next request is fast
    await this.cacheManager.set(cacheKey, job);

    return job;
  }

  async findAll(): Promise<Job[]> {
    // Fetching all jobs, newest first. We can add pagination later!
    return await this.jobsRepository.find({ order: { createdAt: 'DESC' } });
  }
}
