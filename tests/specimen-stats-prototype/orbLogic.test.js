import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllowedBasicOrbTypes, applyOrbEffectsToStats, buildSpecialOrbOptions, buildBasicOrbOptions, normalizeAbilityType, buildAbilityDisplayEntries } from './orbLogic.js';
import { applyOrbEffectsToStats as applyOrbEffectsToStatsShared } from '../../js/orbRules.js';

test('basic attack orbs multiply attack stats', () => {
  const stats = {
    lifeF: 1000,
    speedF: 10,
    atk1F: 200,
    atk2F: 300,
    atk1AbilityF: 50,
    atk2AbilityF: 60
  };

  const result = applyOrbEffectsToStats(stats, [
    { kind: 'basic', orb: { value: 10, category: 'basic_attack' } }
  ], {});

  assert.equal(result.atk1F, 220);
  assert.equal(result.atk2F, 330);
});

test('special add-ability orbs unlock matching basic categories and boost abilities for both attacks', () => {
  const stats = {
    lifeF: 1000,
    speedF: 10,
    atk1F: 200,
    atk2F: 300,
    atk1AbilityF: 50,
    atk2AbilityF: 60
  };

  const result = applyOrbEffectsToStats(stats, [
    { kind: 'special', orb: { value: 10, type: 'addweaken' } },
    { kind: 'basic', orb: { value: 5, category: 'basic_weaken' } }
  ], {});

  assert.deepEqual(getAllowedBasicOrbTypes('addweaken'), ['attack', 'critical', 'life', 'weaken']);
  assert.equal(result.atk1AbilityF, 80);
  assert.equal(result.atk2AbilityF, 105);
});

test('special speed orbs directly boost speed', () => {
  const stats = {
    lifeF: 1000,
    speedF: 10,
    atk1F: 200,
    atk2F: 300,
    atk1AbilityF: 50,
    atk2AbilityF: 60
  };

  const result = applyOrbEffectsToStats(stats, [
    { kind: 'special', orb: { value: 12, type: 'speed' } }
  ], {});

  assert.equal(result.speedF, 11.2);
});

test('ability variants are normalized to their base family', () => {
  assert.equal(normalizeAbilityType('ability_shield_plus'), 'shield');
  assert.equal(normalizeAbilityType('ability_regen'), 'regenerate');
});

test('ability display entries keep separate labels and values', () => {
  const entries = buildAbilityDisplayEntries('shield', 'addretaliate', 20, 10);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries, [
    { label: 'Shield', value: 20 },
    { label: 'Retaliate', value: 10 }
  ]);
});

test('base ability values stay separate from the extra ability granted by special orbs', () => {
  const stats = {
    lifeF: 1000,
    speedF: 10,
    atk1F: 200,
    atk2F: 300,
    atk1AbilityF: 20,
    atk2AbilityF: 30
  };

  const result = applyOrbEffectsToStats(stats, [
    { kind: 'basic', orb: { value: 10, category: 'basic_attack' } },
    { kind: 'special', orb: { value: 10, type: 'addweaken' } },
    { kind: 'basic', orb: { value: 5, category: 'basic_weaken' } }
  ], {});

  assert.equal(result.atk1BaseAbilityF, 22);
  assert.equal(result.atk2BaseAbilityF, 33);
  assert.equal(result.atk1AddedAbilityF, 33);
  assert.equal(result.atk2AddedAbilityF, 49.5);
  assert.equal(result.atk1TotalAbilityF, 55);
  assert.equal(result.atk2TotalAbilityF, 82.5);
});

test('special orb options keep the special categories and basic options remain filtered by the selected special type', () => {
  const specialOptions = buildSpecialOrbOptions({ special: { addweaken: [{ id: 'x', name: 'Curse', value: 5 }], speed: [{ id: 'y', name: 'Speed', value: 2 }] } });
  assert.equal(specialOptions.length, 3);
  assert.equal(specialOptions[1].label, 'Curse');

  const basicOptions = buildBasicOrbOptions({ basic: { attack: [{ id: 'a', name: 'Attack', value: 2 }], weaken: [{ id: 'w', name: 'Weaken', value: 5 }] } }, 'addweaken', 'shield');
  assert.equal(basicOptions.length, 3);
  assert.equal(basicOptions[1].label, 'Attack');
  assert.equal(basicOptions[2].label, 'Weaken');
});

test('shared orb rules apply attack and ability adjustments from selected orbs', () => {
  const stats = {
    lifeF: 1000,
    speedF: 10,
    atk1F: 200,
    atk2F: 300,
    atk1AbilityF: 50,
    atk2AbilityF: 60
  };

  const result = applyOrbEffectsToStatsShared(stats, [
    { kind: 'basic', orb: { value: 10, type: 'attack' } },
    { kind: 'special', orb: { value: 10, type: 'addweaken' } },
    { kind: 'basic', orb: { value: 5, type: 'weaken' } }
  ], { baseAbilityType: 'shield' });

  assert.equal(result.atk1F, 220);
  assert.equal(result.atk1BaseAbilityF, 55);
  assert.equal(result.atk1AddedAbilityF, 33);
  assert.equal(result.atk1TotalAbilityF, 88);
});
