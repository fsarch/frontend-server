export const MAX_VERSION_COUNT = 2;

export const MAX_VERSION_AGE = 60 * 1000;

export const UPLOAD_SECRET = 'a6d844cb-c893-4ccd-8728-f20fe6455a8d';

// DATA_PATH is now configured via storage.data.config.path in config.yaml
// Import getDataPath from global storage for backward compatibility
import { getDataPath } from '../storage/global-storage.js';

export const DATA_PATH = getDataPath();
