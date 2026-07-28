import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local';
const generatedAt = new Date().toISOString();
const releaseId = createHash('sha256')
  .update(`${pkg.version}:${commit}:${generatedAt}`)
  .digest('hex')
  .slice(0, 16);

const manifest = { product: 'RepFlow', version: pkg.version, releaseId, commit, generatedAt };
await writeFile(new URL('../release-manifest.json', import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest));
