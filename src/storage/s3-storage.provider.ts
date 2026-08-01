import { Injectable } from '@nestjs/common';
import { IStorageProvider } from './storage-provider.interface.js';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { StorageConfigS3 } from './storage-config.types.js';
import { Readable } from 'stream';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(config: StorageConfigS3['config']) {
    this.bucket = config.bucket;
    this.prefix = config.prefix || '';

    this.client = new S3Client({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
      endpoint: config.endpoint,
    });
  }

  private getS3Key(path: string): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return this.prefix ? `${this.prefix}/${cleanPath}` : cleanPath;
  }

  async readFile(path: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.getS3Key(path),
    });

    const response = await this.client.send(command);
    const stream = response.Body;

    if (!stream) {
      throw new Error('No body in S3 response');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async writeFile(path: string, data: Buffer): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.getS3Key(path),
      Body: data,
    });

    await this.client.send(command);
  }

  async exists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.getS3Key(path),
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    // No-op for S3 as directories don't exist
    return Promise.resolve();
  }

  async deleteFile(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this.getS3Key(path),
    });

    await this.client.send(command);
  }

  async createReadStream(path: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.getS3Key(path),
    });

    const response = await this.client.send(command);
    const stream = response.Body as Readable;

    if (!stream) {
      throw new Error('No body in S3 response');
    }

    return stream;
  }

  async listFiles(prefix: string): Promise<string[]> {
    const s3Prefix = this.getS3Key(prefix);
    const files: string[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: s3Prefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.client.send(command);
      continuationToken = response.NextContinuationToken;

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key) {
            // Remove the prefix and s3 prefix to get the relative path
            let relativePath = obj.Key;
            if (this.prefix && relativePath.startsWith(this.prefix)) {
              relativePath = relativePath.substring(this.prefix.length + 1);
            }
            if (relativePath.startsWith(prefix)) {
              relativePath = relativePath.substring(prefix.length + 1);
            }
            if (relativePath) {
              files.push(relativePath);
            }
          }
        }
      }
    } while (continuationToken);

    return files;
  }
}
