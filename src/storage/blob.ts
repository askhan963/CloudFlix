import { env } from '../config/env.js';
import { BlobServiceClient } from '@azure/storage-blob';

export const blobService = BlobServiceClient.fromConnectionString(env.blob.connStr);
export const videosContainer = blobService.getContainerClient(env.blob.container);

export async function ensureContainer() {
  await videosContainer.createIfNotExists();
}

// probe
export async function pingBlob() {
  await blobService.getAccountInfo();
  return true;
}
