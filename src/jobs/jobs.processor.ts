import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job as BullJob } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Job as JobEntity } from './job.entity';

@Processor('job-queue')
export class JobsProcessor extends WorkerHost {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobsRepository: Repository<JobEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  async process(job: BullJob<JobEntity>): Promise<any> {
    const dbJobId = job.data.id;

    try {
      await this.jobsRepository.update(dbJobId, { status: 'processing' });
      console.log(
        `Job ${dbJobId} is now processing (Attempt ${job.attemptsMade + 1})...`,
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 🚨 FAKE ERROR SIMULATOR: Force it to fail on the first two attempts!
      if (job.attemptsMade < 2) {
        throw new Error('S3 Bucket connection timeout!');
      }

      await this.jobsRepository.update(dbJobId, {
        status: 'completed',
        result: {
          message: 'Report generated successfully!',
          url: 'https://fake-s3-bucket.com/report.pdf',
        } as Record<string, any>,
      });

      const finishedJob = await this.jobsRepository.findOne({
        where: { id: dbJobId },
      });
      if (finishedJob) {
        await this.cacheManager.set(`job:${dbJobId}`, finishedJob);
      }
      console.log(`Job ${dbJobId} finished and cache updated!`);
    } catch (error: any) {
      console.error(`Job ${dbJobId} failed: ${error.message}`);

      // If it's on its last attempt, mark it as permanently failed in DB
      if (job.attemptsMade >= 2) {
        await this.jobsRepository.update(dbJobId, {
          status: 'failed',
          result: { error: error.message } as Record<string, any>,
        });

        // Update the cache so the frontend knows it failed
        const failedJob = await this.jobsRepository.findOne({
          where: { id: dbJobId },
        });
        if (failedJob) {
          await this.cacheManager.set(`job:${dbJobId}`, failedJob);
        }
        console.log(`Job ${dbJobId} permanently failed. Cache updated.`);
      }

      // We MUST throw the error so BullMQ knows to retry
      throw error;
    }
  }
}
