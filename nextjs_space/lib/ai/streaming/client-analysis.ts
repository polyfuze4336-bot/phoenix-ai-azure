import type { AiResponseLanguage } from '@/lib/ai/language';

export interface PreparedAnalysisImage {
  image: string;
  mimeType: string;
}

export async function prepareAnalysisImages(files: File[]): Promise<PreparedAnalysisImage[]> {
  return Promise.all(
    files.map(async (file) => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read image.'));
        reader.readAsDataURL(file);
      });
      const separator = dataUrl.indexOf(',');
      const image = separator >= 0 ? dataUrl.slice(separator + 1) : '';
      if (!image) throw new Error('The selected image could not be read.');
      return { image, mimeType: file.type || 'image/jpeg' };
    }),
  );
}

async function responseError(response: Response, language: AiResponseLanguage): Promise<Error> {
  if (response.status === 400 || response.status === 413) {
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === 'string' && body.error.trim()) return new Error(body.error);
    } catch {
      // Use the safe localized fallback below.
    }
  }
  return new Error(
    language === 'bm'
      ? 'Analisis tidak dapat diselesaikan sekarang. Sila cuba lagi.'
      : 'The analysis could not be completed right now. Please try again.',
  );
}

function dataFromLine(line: string): string | null {
  const normalized = line.endsWith('\r') ? line.slice(0, -1) : line;
  return normalized.startsWith('data: ') ? normalized.slice(6) : null;
}

export async function readCompletedAnalysis<T>(
  response: Response,
  language: AiResponseLanguage,
): Promise<T> {
  if (!response.ok) throw await responseError(response, language);
  const reader = response.body?.getReader();
  if (!reader) throw await responseError(response, language);

  const decoder = new TextDecoder();
  let pending = '';
  let completed: T | undefined;

  const processLine = (line: string) => {
    const data = dataFromLine(line);
    if (!data || data === '[DONE]') return;
    try {
      const parsed = JSON.parse(data);
      if (parsed?.status === 'completed' && parsed?.result) completed = parsed.result as T;
    } catch {
      // Ignore keep-alive and partial non-JSON events.
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    lines.forEach(processLine);
    if (completed) return completed;
  }
  pending += decoder.decode();
  if (pending) processLine(pending);
  if (completed) return completed;
  throw await responseError(response, language);
}

export async function streamChatText(
  response: Response,
  language: AiResponseLanguage,
  onText: (text: string) => void,
): Promise<void> {
  if (!response.ok) {
    throw new Error(
      language === 'bm'
        ? 'Sembang tidak dapat diselesaikan sekarang. Sila cuba lagi.'
        : 'The chat could not be completed right now. Please try again.',
    );
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing response stream.');

  const decoder = new TextDecoder();
  let pending = '';
  let text = '';
  const processLine = (line: string) => {
    const data = dataFromLine(line);
    if (!data || data === '[DONE]') return;
    try {
      const parsed = JSON.parse(data);
      text += parsed?.choices?.[0]?.delta?.content ?? '';
      onText(text);
    } catch {
      // Ignore keep-alive and partial non-JSON events.
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    lines.forEach(processLine);
  }
  pending += decoder.decode();
  if (pending) processLine(pending);
}
