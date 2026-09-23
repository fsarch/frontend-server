import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from '../../../../utils/upload/upload.service.js';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';

describe('VersionsController', () => {
  let controller: VersionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionsController],
      providers: [
        { provide: UploadService, useValue: {} },
        { provide: VersionsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<VersionsController>(VersionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
