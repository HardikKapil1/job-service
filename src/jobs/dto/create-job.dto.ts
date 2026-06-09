import { IsString, IsObject, IsNotEmpty } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsObject()
  @IsNotEmpty()
  payload!: Record<string, any>;
}
