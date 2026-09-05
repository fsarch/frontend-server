export const MAX_VERSION_COUNT = 20;

export const MAX_VERSION_AGE = 90 * 24 * 60 * 1000;

// Number of files processed in parallel while copying an upload to storage
// and while writing file metadata to the database.
export const UPLOAD_CONCURRENCY = 10;

export const UPLOAD_SECRET = 'a6d844cb-c893-4ccd-8728-f20fe6455a8d';

// Headers that can be set on a version upload request to attach metadata to
// the created version.
export const VERSION_NAME_HEADER = 'x-version-name';
export const VERSION_DESCRIPTION_HEADER = 'x-version-description';
export const VERSION_EXTERNAL_ID_HEADER = 'x-version-external-id';

// DATA_PATH is now configured via storage.data.config.path in config.yaml
// Import getDataPath from global storage for backward compatibility
import { getDataPath } from '../storage/global-storage.js';

export const DATA_PATH = getDataPath();
