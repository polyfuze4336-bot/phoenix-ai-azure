/**
 * Storage facade for Phoenix AI.
 *
 * Exposes a single `getStorageProvider()` factory returning the Azure Blob Storage
 * implementation, plus the shared validation/config helpers. This is the Azure-native
 * replacement for the removed AWS S3 helpers.
 *
 * NOTE: No current Phoenix AI workflow persists files (wound/burn images are handled
 * as ephemeral base64 by the AI routes), so this provider is deliberately not wired
 * into any UI workflow. It is available for future features that require persistence.
 *
 * SERVER-ONLY. Do not import from client components.
 */

import { AzureBlobProvider } from './azure-blob-provider';
import type { StorageProvider } from './types';

export {
  ALLOWED_STORAGE_MIME_TYPES,
  StorageError,
  buildBlobPath,
  isAllowedStorageContentType,
  maxStorageFileBytes,
  validateUpload,
} from './types';
export type {
  AllowedStorageMimeType,
  ReadUrl,
  ReadUrlOptions,
  StorageMetadata,
  StorageProvider,
  StorageValidation,
  UploadInput,
  UploadResult,
} from './types';

let provider: StorageProvider | undefined;

/** Return the process-wide Azure Blob Storage provider (lazily constructed). */
export function getStorageProvider(): StorageProvider {
  if (!provider) {
    provider = new AzureBlobProvider();
  }
  return provider;
}
