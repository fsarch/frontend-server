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

// Create and export the dynamic module directly
export const StorageConfigurationDynamicModule = ModuleConfiguration.register(STORAGE_CONFIG_TOKEN, {
  name: 'storage.data',
  validationSchema: STORAGE_DATA_SCHEMA,
});
