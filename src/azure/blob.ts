import 'dotenv/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
if (!connStr) throw new Error('AZURE_STORAGE_CONNECTION_STRING is required');

export const blobService = BlobServiceClient.fromConnectionString(connStr);

const containerName = process.env.BLOB_CONTAINER || 'uploads';
export const containerClient: ContainerClient = blobService.getContainerClient(containerName);

export async function ensureContainer(): Promise<void> {
  await containerClient.createIfNotExists();
}

export async function testBlob(): Promise<boolean> {
  // simple call to ensure we can reach the account
  await blobService.getAccountInfo();
  return true;
}
