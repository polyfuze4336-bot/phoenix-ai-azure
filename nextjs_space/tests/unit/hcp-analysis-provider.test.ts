import test from 'node:test';
import assert from 'node:assert/strict';
import { AzureFoundryProvider } from '../../lib/ai/azure-foundry-provider';
import { AiError, type AiChatRequest } from '../../lib/ai/types';
import { runAnalysisPipeline, runGeneralWoundAnalysis } from '../../lib/ai/analysis/pipeline';
import { baseInterpretation, baseManagement, baseObservation, passingCritic } from '../rai/_fixtures';
import { WOUND_VISUAL_OBSERVATION_PROMPT } from '../../lib/ai/prompts/wound-visual-observation';
import { GENERAL_WOUND_ANALYSIS_PROMPT } from '../../lib/ai/prompts/general-wound-analysis';

function completion(value: unknown) {
  const body = new TextEncoder().encode(
    `data: ${JSON.stringify({ choices: [{ delta: { content: JSON.stringify(value) } }] })}\n\n` +
    'data: [DONE]\n\n',
  );
  return { correlationId: 'test', body: new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(body); controller.close(); },
  }) };
}

const wound = {
  woundCategory: 'General wound',
  woundCharacteristics: 'Visible tissue change',
  confidenceLevel: 'moderate',
  timers: {
    tissueManagement: 'Assess tissue', infectionInflammation: 'Examine',
    moistureImbalance: 'Assess moisture', edgeOfWound: 'Assess edge',
    repairRegeneration: 'Monitor', socialPatientFactors: 'Not supplied',
  },
  managementRecommendations: {
    woundCareProtocol: 'Clinical review', dressingRecommendations: 'Select after examination',
    referralCriteria: 'Escalate if needed', followUpSchedule: 'Review',
  },
  whyThisAssessment: ['Visible tissue change'],
  visualExtent: 'Localised', measuredDimensions: 'Unable to determine reliably',
  redFlags: [], missingInformation: [], limitations: [], refinementOptions: [],
};

for (const anatomicalLocation of ['forearm', 'perineal region']) {
  test(`Acute Burn provider stream parses ${anatomicalLocation} image and retains deterministic Parkland`, async (t) => {
    const calls: string[] = [];
    t.mock.method(AzureFoundryProvider.prototype, 'streamChatCompletion', async (request: AiChatRequest) => {
      calls.push(request.route ?? '');
      assert.equal(request.responseFormat, 'json_object');
      if (request.route?.endsWith(':observation'))
        return completion(baseObservation({ anatomicalLocation }));
      if (request.route?.endsWith(':interpretation'))
        return completion(baseInterpretation({ tbsaEstimate: 15 }));
      if (request.route?.endsWith(':management')) return completion(baseManagement());
      return completion(passingCritic);
    });
    const result = await runAnalysisPipeline({
      imageDataUrl: 'data:image/png;base64,TEST', language: 'en',
      patient: { weightKg: 70, ageGroup: 'adult' },
    });
    assert.deepEqual(calls, [
      'analyze-wound:observation', 'analyze-wound:interpretation',
      'analyze-wound:management', 'analyze-wound:critic',
    ]);
    assert.equal(result.observation.anatomicalLocation, anatomicalLocation);
    assert.equal(result.parkland.total24hMl, 4200);
  });

  test(`General Wound provider stream parses ${anatomicalLocation} image without burn calculations`, async (t) => {
    const calls: string[] = [];
    t.mock.method(AzureFoundryProvider.prototype, 'streamChatCompletion', async (request: AiChatRequest) => {
      calls.push(request.route ?? '');
      return completion(request.route?.includes('observation')
        ? baseObservation({ anatomicalLocation, visibleFindings: ['tissue change'] }) : wound);
    });
    const result = await runGeneralWoundAnalysis({ imageDataUrl: 'data:image/png;base64,TEST', language: 'en' });
    assert.deepEqual(calls, ['analyze-wound:general-observation', 'analyze-wound:general-assessment']);
    assert.equal(result.observation.anatomicalLocation, anatomicalLocation);
    assert.equal('parkland' in result, false);
    assert.equal('tbsaEstimate' in result, false);
  });
}

for (const run of [runAnalysisPipeline, runGeneralWoundAnalysis]) {
  test(`${run.name} propagates categorized provider refusal without fabricating a result`, async (t) => {
    t.mock.method(AzureFoundryProvider.prototype, 'streamChatCompletion', async () => {
      throw new AiError({
        code: 'bad_request', category: 'AI_CONTENT_FILTER', status: 422,
        clientMessage: 'This clinical image could not be analysed by the AI service.',
      });
    });
    await assert.rejects(
      run({ imageDataUrl: 'data:image/jpeg;base64,TEST', language: 'en' }),
      (error: unknown) => error instanceof AiError && error.category === 'AI_CONTENT_FILTER',
    );
  });
}

test('both clinical prompts frame sensitive locations as medical observations only', () => {
  assert.match(WOUND_VISUAL_OBSERVATION_PROMPT, /normally private anatomical area/i);
  assert.match(GENERAL_WOUND_ANALYSIS_PROMPT, /normally private anatomical areas/i);
});
