/**
 * The ports-and-adapters dependency rule, enforced:
 *
 *   domain  → nothing but domain
 *   ports   → domain
 *   app     → domain, ports
 *   ui      → domain, ports, app   (+ the i18n language list)
 *   adapters→ domain, ports
 *
 * Only src/main.tsx, the composition root, may import adapters and wire them up.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '../src');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const files = walk(SRC);
const layerOf = (path: string) => relative(SRC, path).split('/')[0];

const ALLOWED: Record<string, string[]> = {
  domain: ['domain'],
  ports: ['ports', 'domain'],
  app: ['app', 'domain', 'ports'],
  adapters: ['adapters', 'domain', 'ports', 'locales'],
  ui: ['ui', 'app', 'domain', 'ports'],
};
/** The UI may know which languages exist, and the developer matrix page reads the generated dummy data – nothing else from the adapters. */
const EXCEPTIONS = new Set(['ui/shared/bits.tsx -> adapters/i18n.ts', 'ui/dev/MatrixPage.tsx -> adapters/dummy/generated.ts']);

describe('dependency rule', () => {
  const code = files.filter((f) => /\.tsx?$/.test(f) && layerOf(f) in ALLOWED);
  it.each(code.map((f) => relative(SRC, f)))('%s only imports from allowed layers', (rel) => {
    const file = join(SRC, rel);
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:from|import)\s+'(\.[^']+)'/g)) {
      const target = relative(SRC, resolve(dirname(file), match[1]));
      const layer = target.split('/')[0];
      if (EXCEPTIONS.has(`${rel} -> ${target}.ts`)) continue;
      expect(ALLOWED[layerOf(file)], `${rel} imports ${target}`).toContain(layer);
    }
  });
  it('the domain imports no packages at all', () => {
    for (const f of files.filter((x) => layerOf(x) === 'domain')) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/from '[^.]/);
    }
  });
});

describe('colours', () => {
  it.each(files.filter((f) => /\.(css|tsx?)$/.test(f)).map((f) => relative(SRC, f)))('%s uses oklch() only', (rel) => {
    const source = readFileSync(join(SRC, rel), 'utf8').replace(/&#\d+;|#root|#\{/g, '');
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).not.toMatch(/\b(rgba?|hsla?|hwb|lab|lch|color-mix)\(/);
    expect(source).not.toMatch(/:\s*(white|black|red|gr[ae]y|transparent)\s*[;,)]/);
  });
});
