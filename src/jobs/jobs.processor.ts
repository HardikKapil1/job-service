import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job as BullJob } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job as JobEntity } from './job.entity';

@Processor('job-queue')
export class JobsProcessor extends WorkerHost {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobsRepository: Repository<JobEntity>,
  ) {
    super();
  }

  async process(job: BullJob<JobEntity>): Promise<any> {
    const dbJobId = job.data.id;

    // 1. Mark as processing (Make sure the second argument is an object!)
    await this.jobsRepository.update(dbJobId, { status: 'processing' });
    console.log(`Job ${dbJobId} is now processing...`);

    // 2. Simulate a heavy backend task (e.g., generating a PDF)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 3. Mark as completed and save the mock result
    await this.jobsRepository.update(dbJobId, {
      status: 'completed',
      result: {
        message: 'Report generated successfully!',
        url: 'https://fake-s3-bucket.com/report.pdf',
      } as Record<string, any>,
    });

    console.log(`Job ${dbJobId} finished!`);
  }
}
