import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const cache = new Map();
function load(relativePath) {
  if (cache.has(relativePath)) return cache.get(relativePath);
  const filename = fileURLToPath(new URL(`../src/${relativePath}`, import.meta.url));
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)((name) => {
    assert.ok(!name.startsWith('next/'), 'Reusable components must work without Next.js');
    if (name.startsWith('@/')) {
      return load(name.slice(2) + (name.startsWith('@/components/') ? '.tsx' : '.ts'));
    }
    return require(name);
  }, module, module.exports);
  cache.set(relativePath, module.exports);
  return module.exports;
}
const { KeyringConnectModuleC } = load('components/KeyringConnectModuleC.tsx');

test('credential submission is enabled; confirmation cannot be resubmitted or canceled', () => {
  const render = step => renderToStaticMarkup(createElement(KeyringConnectModuleC, {
    step, onAction() {}, onCancel() {},
  }));
  const ready = render('calldata-ready');
  assert.match(ready, /Submit Credential/);
  assert.doesNotMatch(ready, /disabled=""/);
  assert.match(ready, /Cancel/);
  const pending = render('transaction-pending');
  assert.match(pending, /Confirming Transaction/);
  assert.match(pending, /disabled=""/);
  assert.doesNotMatch(pending, /Cancel|Access Granted/);
  assert.match(render('verified'), /Access Granted/);
});
