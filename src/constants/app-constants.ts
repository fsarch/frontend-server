import path from 'node:path';

export const DATA_PATH = path.resolve(process.cwd(), process.env.DATA_PATH ?? './data');
