import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
export class JobsController {
  // Inject the service via the constructor
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  async createJob(@Body() createJobDto: CreateJobDto) {
    return await this.jobsService.create(createJobDto);
  }

  @Get(':id')
  async getJob(@Param('id') id: string) {
    return await this.jobsService.findOne(id);
  }

  @Get()
  async listJobs() {
    return await this.jobsService.findAll();
  }
}
