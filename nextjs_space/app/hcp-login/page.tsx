import { resolveAuthMode } from '@/lib/auth/auth-config';
import { LoginClient } from './_components/login-client';

export const dynamic = 'force-dynamic';

type LoginErrorCode = 'unauthorized' | 'forbidden' | 'unavailable' | null;

function normaliseError(value: string | string[] | undefined): LoginErrorCode {
  const code = Array.isArray(value) ? value[0] : value;
  if (code === 'unauthorized' || code === 'forbidden' || code === 'unavailable') {
    return code;
  }
  return null;
}

export default function HcpLoginPage({
  searchParams,
}: {
  searchParams?: { error?: string | string[] };
}) {
  const mode = resolveAuthMode();
  const initialError = normaliseError(searchParams?.error);
  return <LoginClient mode={mode} initialError={initialError} />;
}
