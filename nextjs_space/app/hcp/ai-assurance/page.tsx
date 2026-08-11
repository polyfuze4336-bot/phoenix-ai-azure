import type { Metadata } from 'next';
import { PhoenixShell } from '@/components/phoenix-v2-shell';
import { AiAssuranceClient } from './_components/ai-assurance-client';
import { RAI_CONTROLS, ASSURANCE_STAGES, controlStatusCounts } from '@/lib/rai/controls';
import { getGovernanceSnapshot } from '@/lib/rai/governance';

export const metadata: Metadata = { title: 'AI Assurance · Phoenix AI v2.0' };

export default function V2AiAssurancePage() {
  // Architecture version is kept in docs/architecture/ARCHITECTURE_VERSION.
  const governance = getGovernanceSnapshot('1.3.0');
  return (
    <PhoenixShell
      variant="hcp"
      title="AI Assurance"
      subtitle="Controls supporting reliable, transparent and human-supervised AI-assisted assessment."
    >
      <AiAssuranceClient
        controls={RAI_CONTROLS}
        stages={ASSURANCE_STAGES}
        counts={controlStatusCounts()}
        governance={governance}
      />
    </PhoenixShell>
  );
}
