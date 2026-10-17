import { ModuleConfiguration } from '@fsarch/server/configuration';
import Joi from 'joi';
import { STORAGE_CONFIG_TOKEN } from './storage-constants.js';

const STORAGE_DATA_SCHEMA = Joi.alternatives().try(
  Joi.string(),
  Joi.object({
    type: Joi.string().valid('filesystem').required(),
    config: Joi.object({
      path: Joi.string().required(),
    }).required(),
  }),
  Joi.object({
    type: Joi.string().valid('s3').required(),
    config: Joi.object({
      bucket: Joi.string().required(),
      region: Joi.string().required(),
      accessKeyId: Joi.string().optional(),
      secretAccessKey: Joi.string().optional(),
      endpoint: Joi.string().optional(),
      prefix: Joi.string().optional(),
    }).required(),
  }),
);

// Export the token for easier access
export { STORAGE_CONFIG_TOKEN };

// A factory, not a frozen constant, so each mono-service mount (see
// `StorageModule.register()`) gets its own `serviceId`-scoped config
// section instead of all mounts sharing one. Standalone callers simply omit
// `serviceId`, unchanged from before this was a factory.
export const createStorageConfigurationModule = (serviceId?: string) =>
  ModuleConfiguration.register(STORAGE_CONFIG_TOKEN, {
    name: 'storage.data',
    validationSchema: STORAGE_DATA_SCHEMA,
    serviceId,
  });
