import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { resolve } from 'node:path';
import Joi from 'joi';

const YAML_CONFIG_FILENAME = 'config.yaml';

const CONFIG_VALIDATION_SCHEMA = Joi.object({
  uac: Joi.alternatives(
    Joi.object({
      type: Joi.string()
        .valid('static')
        .required(),
      users: Joi.array().items(
        Joi.object({
          user_id: Joi.string().required(),
          permissions: Joi.array().items(
            Joi.string()
              .valid('manage_claims', 'manage_images', 'manage_projects')
              .required(),
          ).required(),
        })
      ),
    }),
  ),
  auth: Joi.object({
    type: Joi.string().valid('jwt-jwk', 'static').required(),
    jwkUrl: Joi.string(),
  }),
  storage: Joi.object({
    data: Joi.alternatives().try(
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
          accessKeyId: Joi.string(),
          secretAccessKey: Joi.string(),
          endpoint: Joi.string(),
          prefix: Joi.string(),
        }).required(),
      }),
    ).required(),
  }).default({}),
}).unknown(true);

export default () => {
  const configPath = resolve(process.cwd(), process.env.CONFIG_FILE_PATH || YAML_CONFIG_FILENAME);
  const config = yaml.load(
    readFileSync(configPath, 'utf8'),
  ) as Record<string, any>;

  const valid = CONFIG_VALIDATION_SCHEMA.validate(config, { abortEarly: false, allowUnknown: true });
  if (valid.error) {
    console.error('Error while validating config:', valid.error.details);
    throw new Error('Invalid config');
  }

  return valid.value;
};
