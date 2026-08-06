/**
 * Azure Blob Storage implementation of the Phoenix AI storage contract.
 *
 * Security posture (see also lib/storage/types.ts):
 * - Authenticates with a MANAGED IDENTITY via DefaultAzureCredential (user-assigned
 *   selected by AZURE_CLIENT_ID; Azure CLI locally). No account key is ever read,
 *   so no key can leak to the browser.
 * - Reads are served through short-lived, read-only USER DELEGATION SAS URLs minted
 *   with the managed identity — never account-key SAS.
 * - The target container MUST be PRIVATE (no public access). This provider never
 *   creates or configures public access.
 * - Never logs image/file bytes or metadata values.
 *
 * SERVER-ONLY. Do not import from client components.
 */

import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  generateBlobSASQueryParameters,
  type ContainerClient,
} from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import {
  StorageError,
  buildBlobPath,
  validateUpload,
  type ReadUrl,
  type ReadUrlOptions,
  type StorageProvider,
  type UploadInput,
  type UploadResult,
} from './types';

const DEFAULT_CONTAINER = 'clinical-uploads';
const DEFAULT_READ_TTL_SECONDS = 300; // 5 minutes
const MIN_READ_TTL_SECONDS = 60;
const MAX_READ_TTL_SECONDS = 3600; // 1 hour ceiling on any read URL

interface ResolvedConfig {
  accountUrl: string;
  containerName: string;
}

function resolveConfig(): ResolvedConfig {
  const explicitUrl = process.env.AZURE_STORAGE_ACCOUNT_URL?.trim();
  const accountName = process.env.AZURE_STORAGE_ACCOUNT?.trim();
  const accountUrl = explicitUrl || (accountName ? `https://${accountName}.blob.core.windows.net` : '');
  if (!accountUrl) {
    throw new StorageError(
      'Storage is not configured. Set AZURE_STORAGE_ACCOUNT (or AZURE_STORAGE_ACCOUNT_URL).',
      'storage_not_configured',
    );
  }
  const containerName = process.env.AZURE_STORAGE_CONTAINER?.trim() || DEFAULT_CONTAINER;
  return { accountUrl, containerName };
}

export class AzureBlobProvider implements StorageProvider {
  private serviceClient?: BlobServiceClient;
  private containerClient?: ContainerClient;

  private getContainerClient(): ContainerClient {
    if (!this.containerClient) {
      const { accountUrl, containerName } = resolveConfig();
      const credential = new DefaultAzureCredential(
        process.env.AZURE_CLIENT_ID ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID } : undefined,
      );
      this.serviceClient = new BlobServiceClient(accountUrl, credential);
      this.containerClient = this.serviceClient.getContainerClient(containerName);
    }
    return this.containerClient;
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const size = input.data.byteLength;
    const validation = validateUpload(input.contentType, size);
    if (!validation.ok) {
      throw new StorageError(validation.error, 'invalid_upload');
    }

    const blobPath = buildBlobPath(input.category, validation.contentType, input.fileName);
    const container = this.getContainerClient();
    const blockBlob = container.getBlockBlobClient(blobPath);

    const uploaded = await blockBlob.uploadData(
      input.data instanceof Buffer ? input.data : Buffer.from(input.data),
      {
        blobHTTPHeaders: { blobContentType: validation.contentType },
        metadata: sanitizeMetadata(input.metadata),
        onProgress: input.onProgress ? (ev) => input.onProgress?.(ev.loadedBytes) : undefined,
      },
    );

    return {
      blobPath,
      contentType: validation.contentType,
      size,
      etag: uploaded.etag,
      uploadedAt: new Date().toISOString(),
    };
  }

  async getReadUrl(blobPath: string, options?: ReadUrlOptions): Promise<ReadUrl> {
    assertBlobPath(blobPath);
    const container = this.getContainerClient();
    const service = this.serviceClient;
    if (!service) {
      throw new StorageError('Storage client is not initialised.', 'storage_not_configured');
    }

    const ttl = clampTtl(options?.expiresInSeconds);
    const startsOn = new Date(Date.now() - 5 * 1000); // small clock-skew allowance
    const expiresOn = new Date(Date.now() + ttl * 1000);

    // User delegation key is signed by the managed identity — no account key.
    const userDelegationKey = await service.getUserDelegationKey(startsOn, expiresOn);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: container.containerName,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse('r'),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      userDelegationKey,
      service.accountName,
    ).toString();

    const blockBlob = container.getBlockBlobClient(blobPath);
    return { url: `${blockBlob.url}?${sas}`, expiresAt: expiresOn.toISOString() };
  }

  async delete(blobPath: string): Promise<void> {
    assertBlobPath(blobPath);
    const container = this.getContainerClient();
    await container.getBlockBlobClient(blobPath).deleteIfExists({ deleteSnapshots: 'include' });
  }

  async exists(blobPath: string): Promise<boolean> {
    assertBlobPath(blobPath);
    const container = this.getContainerClient();
    return container.getBlockBlobClient(blobPath).exists();
  }
}

/** Reject empty or traversal-style paths before any storage call. */
function assertBlobPath(blobPath: string): void {
  if (typeof blobPath !== 'string' || blobPath.trim() === '' || blobPath.includes('..')) {
    throw new StorageError('Invalid blob path.', 'invalid_path');
  }
}

function clampTtl(requested?: number): number {
  if (!Number.isFinite(requested) || (requested ?? 0) <= 0) return DEFAULT_READ_TTL_SECONDS;
  return Math.min(MAX_READ_TTL_SECONDS, Math.max(MIN_READ_TTL_SECONDS, Math.floor(requested as number)));
}

/**
 * Azure blob metadata keys must be valid C# identifiers and values ASCII. Drop any
 * key/value that would be rejected, and stamp a non-sensitive source marker.
 */
function sanitizeMetadata(metadata?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { source: 'phoenix-ai' };
  if (!metadata) return out;
  for (const [key, value] of Object.entries(metadata)) {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && /^[\x20-\x7E]*$/.test(value)) {
      out[key] = value;
    }
  }
  return out;
}
