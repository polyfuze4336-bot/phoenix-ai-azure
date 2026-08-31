/** Server-side config for the AI video generation feature. All server-only. */
export interface VideoStudioConfig {
  enabled: boolean;
  endpoint: string | undefined;
  modelDeployment: string;
  firstAidVideoUrl: string | undefined;
}

export function getVideoStudioConfig(): VideoStudioConfig {
  return {
    enabled: process.env.AZURE_VIDEO_GENERATION_ENABLED === 'true' &&
             Boolean(process.env.AZURE_VIDEO_ENDPOINT?.trim()),
    endpoint: process.env.AZURE_VIDEO_ENDPOINT?.trim() || undefined,
    modelDeployment: process.env.AZURE_VIDEO_MODEL_DEPLOYMENT?.trim() || 'sora-2',
    firstAidVideoUrl: process.env.FIRST_AID_VIDEO_URL?.trim() || undefined,
  };
}
