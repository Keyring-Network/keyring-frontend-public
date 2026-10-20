import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Execute the published snippets so the instructions themselves are covered.
const guide = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
const subscription = guide.match(/```typescript\n(useEffect[\s\S]*?)\n```/)[1];
const launch = guide.match(/```typescript\n(\/\/ Launch extension[\s\S]*?)\n```/)[1];
const future = Math.floor(Date.now() / 1000) + 3600;
const credential = { trader: '0xabc', chainId: 1, policyId: 7, validUntil: future };

function harness(cached) {
  let dependencies, cleanup, callback, data, flow;
  let unsubscribed = 0;
  const useEffect = (effect, next) => {
    if (dependencies?.every((value, i) => Object.is(value, next[i]))) return;
    cleanup?.();
    dependencies = next;
    cleanup = effect();
  };
  const sdk = {
    subscribeToExtensionState(cb) {
      callback = cb;
      if (cached) cb({ credentialData: cached });
      return () => { unsubscribed++; };
    },
  };
  const setFlow = (next) => { flow = typeof next === 'function' ? next(flow) : next; };
  const render = (address = '0xabc', chain = 1, policy = 7) => {
    new Function('useEffect', 'KeyringConnect', 'address', 'activeChainId', 'KEYRING_CONFIG',
      'setCredentialData', 'setFlowState', 'setExtensionInstalled', subscription)(
      useEffect, sdk, address, chain, { policyId: policy, env: 'prod' }, value => { data = value; }, setFlow, () => {});
  };
  return { render, emit: value => callback({ credentialData: value }), setFlow,
    get data() { return data; }, get flow() { return flow; },
    get unsubscribed() { return unsubscribed; } };
}

test('chain and policy changes clear cached credentials and resubscribe', () => {
  const h = harness();
  h.render(); h.emit(credential);
  assert.equal(h.flow, 'calldata-ready');
  h.render('0xabc', 42161);
  assert.equal(h.unsubscribed, 1);
  assert.equal(h.data, null);
  h.emit(credential);
  assert.equal(h.data, null);
  h.emit({ ...credential, chainId: 42161 });
  assert.equal(h.flow, 'calldata-ready');
  h.render('0xabc', 42161, 8);
  assert.equal(h.data, null);
  h.emit({ ...credential, chainId: 42161 });
  assert.equal(h.data, null);
});

test('immediate cached delivery survives reset; pending and valid states win', () => {
  const h = harness(credential);
  h.render();
  assert.equal(h.data, credential);
  assert.equal(h.flow, 'calldata-ready');
  for (const state of ['transaction-pending', 'valid']) {
    h.setFlow(state); h.emit(credential);
    assert.equal(h.flow, state);
  }
  h.render(undefined); // unchanged context does not reset
  assert.equal(h.flow, 'valid');
  h.render(null);
  assert.equal(h.data, null);
});

test('expired and mismatched data never become ready', () => {
  const h = harness(); h.render();
  for (const patch of [{ validUntil: 1 }, { validUntil: NaN }, { trader: '0xdef' }, { policyId: 8 }]) {
    h.emit({ ...credential, ...patch });
    assert.equal(h.data, null);
    assert.equal(h.flow, 'loading');
  }
});

test('launch revalidates cached data at click time', () => {
  for (const patch of [null, { validUntil: 1 }, { chainId: 42161 }, { policyId: 8 }, { trader: '0xdef' }]) {
    let flow, launched = false, cleared = false;
    new Function('credentialData', 'userAddress', 'chainId', 'KEYRING_CONFIG',
      'setFlowState', 'setCredentialData', 'KeyringConnect', 'window', launch)(
      { ...credential, ...patch }, '0xabc', 1, { policyId: 7, env: 'prod' },
      value => { flow = value; }, value => { cleared = value === null; },
      { launchExtension: config => { assert.equal(config.policy_id, 7); assert.equal(config.krn_config, undefined); launched = true; return Promise.resolve(); } },
      { location: { origin: 'https://example.test' } });
    assert.equal(launched, patch !== null);
    assert.equal(cleared, patch !== null);
    assert.equal(flow, patch === null ? 'calldata-ready' : 'progress');
  }
});


test('development launch selects development services with the on-chain ID', () => {
  let config;
  new Function('credentialData', 'userAddress', 'chainId', 'KEYRING_CONFIG',
    'setFlowState', 'setCredentialData', 'KeyringConnect', 'window', launch)(
    null, '0xabc', 1, { policyId: 7, env: 'dev' },
    () => {}, () => {},
    { launchExtension: value => { config = value; return Promise.resolve(); } },
    { location: { origin: 'https://example.test' } });
  assert.equal(config.policy_id, 7);
  assert.deepEqual(config.krn_config, {
    keyring_api_url: 'https://main.api.keyring-backend.krndev.net',
    keyring_user_app_url: 'https://app.keyringdev.network',
  });
});
