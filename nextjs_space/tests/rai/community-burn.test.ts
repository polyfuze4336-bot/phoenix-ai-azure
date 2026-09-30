import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyCommunityBurn, type BurnAnswers } from '../../lib/clinical/community-burn';
import { RAI_CONTROLS } from '../../lib/rai/controls';

const baseline: BurnAnswers = {
  cause: 'scald', sizeScore: 0, appearanceScore: 0, painScore: 0,
  shortnessOfBreath: 'no', chestPain: 'no', dizziness: 'no',
  blurredVision: 'no', tinnitus: 'no', blast: 'no',
  lossOfConsciousness: 'no', faceOrEyes: 'no',
};

test('Community red-flag control honestly remains partial pending clinical validation', () => {
  assert.equal(RAI_CONTROLS.find((control) => control.id === 'RAI-SAFE-013')?.status, 'partial');
});

test('emergency override cannot be downgraded by unmapped causes or other answers', () => {
  for (const cause of ['contact', 'other', 'unsure', 'scald'] as const) {
    for (const symptom of ['shortnessOfBreath', 'chestPain', 'lossOfConsciousness'] as const) {
      assert.deepEqual(classifyCommunityBurn({ ...baseline, cause, [symptom]: 'yes' }),
        { classification: 'major', disposition: 'emergency' });
    }
  }
});

test('uncertain answers are not treated as negative; images are not an input to disposition', () => {
  assert.equal(classifyCommunityBurn({ ...baseline, shortnessOfBreath: 'unsure' }).disposition, 'hospital');
  assert.equal(classifyCommunityBurn({ ...baseline, blurredVision: 'unsure', cause: 'chemical' }).disposition, 'hospital');
  assert.equal(classifyCommunityBurn({ ...baseline, blast: 'unsure' }).disposition, 'hospital');
  assert.equal(classifyCommunityBurn({ ...baseline, cause: 'other' }).classification, 'indeterminate');
});
