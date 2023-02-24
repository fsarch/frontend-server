import path from 'node:path';

export const DATA_PATH = path.resolve(process.cwd(), process.env.DATA_PATH ?? './data');

export const MAX_VERSION_COUNT = 2;

export const MAX_VERSION_AGE = 60 * 1000;
