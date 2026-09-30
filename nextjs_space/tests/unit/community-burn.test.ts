import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyCommunityBurn, type BurnAnswers } from '../../lib/clinical/community-burn';
import { en } from '../../lib/i18n/en';
import { ms } from '../../lib/i18n/ms';

const baseline: BurnAnswers = {
  cause: 'scald', sizeScore: 0, appearanceScore: 0, painScore: 0,
  shortnessOfBreath: 'no', chestPain: 'no', dizziness: 'no',
  blurredVision: 'no', tinnitus: 'no', blast: 'no',
  lossOfConsciousness: 'no', faceOrEyes: 'no',
};

test('original score thresholds and three-to-two category mapping', () => {
  assert.deepEqual(classifyCommunityBurn(baseline), { classification: 'minor', disposition: 'clinic' });
  assert.deepEqual(classifyCommunityBurn({ ...baseline, sizeScore: 2 }), { classification: 'minor', disposition: 'clinic' });
  assert.deepEqual(classifyCommunityBurn({ ...baseline, sizeScore: 4 }), { classification: 'major', disposition: 'hospital' });
  assert.deepEqual(classifyCommunityBurn({ ...baseline, sizeScore: 4, appearanceScore: 4 }), { classification: 'major', disposition: 'emergency' });
});

test('unmapped mechanisms never receive a score; emergency red flags override uncertainty', () => {
  for (const cause of ['contact', 'other', 'unsure'] as const) {
    assert.equal(classifyCommunityBurn({ ...baseline, cause }).classification, 'indeterminate');
    assert.deepEqual(classifyCommunityBurn({ ...baseline, cause, chestPain: 'yes' }), { classification: 'major', disposition: 'emergency' });
  }
  assert.equal(classifyCommunityBurn({ ...baseline, painScore: -1 }).classification, 'indeterminate');
});

test('prototype symptom and mechanism escalation is monotone', () => {
  for (const symptom of ['shortnessOfBreath', 'chestPain', 'lossOfConsciousness'] as const) {
    assert.equal(classifyCommunityBurn({ ...baseline, [symptom]: 'yes' }).disposition, 'emergency');
    assert.equal(classifyCommunityBurn({ ...baseline, [symptom]: 'unsure' }).disposition, 'hospital');
  }
  for (const cause of ['chemical', 'electrical'] as const) {
    assert.deepEqual(classifyCommunityBurn({ ...baseline, cause }), { classification: 'major', disposition: 'hospital' });
  }
  for (const symptom of ['dizziness', 'blurredVision', 'blast', 'faceOrEyes'] as const) {
    assert.equal(classifyCommunityBurn({ ...baseline, [symptom]: 'yes' }).disposition, 'hospital');
  }
  assert.equal(classifyCommunityBurn({ ...baseline, tinnitus: 'yes' }).disposition, 'clinic');
  assert.equal(classifyCommunityBurn({ ...baseline, tinnitus: 'yes', blast: 'yes' }).disposition, 'hospital');
  assert.equal(classifyCommunityBurn({ ...baseline, cause: 'electrical', chestPain: 'unsure' }).disposition, 'emergency');
  assert.equal(classifyCommunityBurn({ ...baseline, cause: 'electrical', dizziness: 'yes' }).disposition, 'emergency');
  assert.equal(classifyCommunityBurn({ ...baseline, faceOrEyes: 'unsure', cause: 'chemical' }).disposition, 'hospital');
});

test('First Aid primary order and bilingual content retain burn and wound guidance', () => {
  for (const resource of [en, ms]) {
    const guides = resource.community.firstAid.guides;
    assert.deepEqual(guides.map((g) => g.id), ['flame', 'burn', 'chemical', 'electrical', 'wound']);
    assert.match(guides[0].steps.join(' '), /20/);
    assert.match(guides[1].steps.join(' '), /20/);
    assert.ok(guides[2].steps.length > 4);
    assert.ok(guides[3].steps[0].length > 25);
    assert.equal(guides[4].steps.length, 5);
    assert.ok(resource.community.firstAid.sunburn.steps.length > 0);
  }
});
