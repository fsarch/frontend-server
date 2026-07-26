import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(2048)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
