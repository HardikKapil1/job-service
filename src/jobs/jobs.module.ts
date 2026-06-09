import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq'; // <-- Add this
import { Job } from './job.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsProcessor } from './jobs.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    // Register the specific queue here:
    BullModule.registerQueue({
      name: 'job-queue',
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsProcessor],
})
export class JobsModule {}
