import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectVersion } from '../../../../database/entities/project-version.entity.js';
import { VersionsService } from './versions.service';

describe('VersionsService', () => {
  let service: VersionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionsService,
        {
          provide: getRepositoryToken(ProjectVersion),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<VersionsService>(VersionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
