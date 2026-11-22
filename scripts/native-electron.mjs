import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require_ = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function flag(name, fallback) {
    const prefix = `--${name}=`;
    const hit = process.argv.find((arg) => arg.startsWith(prefix));

    return hit === undefined ? fallback : hit.slice(prefix.length);
}

function readJson(file) {
    return JSON.parse(readFileSync(file, 'utf8'));
}

function fail(message) {
    console.error(`native-electron: ${message}`);
    process.exit(1);
}

const platform = flag('platform', process.platform);
const arch = flag('arch', 'x64');
const electronVersion = readJson(
    path.join(root, 'node_modules/electron/package.json')
).version;
const abi = readFileSync(
    path.join(root, 'node_modules/electron/abi_version'),
    'utf8'
).trim();

const source = path.dirname(
    require_.resolve('better-sqlite3/package.json', { paths: [root] })
);
const version = readJson(path.join(source, 'package.json')).version;
const work = path.join(root, 'build/native/better-sqlite3');
const target = path.join(
    root,
    '.output/server/node_modules/better-sqlite3/build/Release/better_sqlite3.node'
);

if (!existsSync(path.join(root, '.output/server/index.mjs'))) {
    fail('no .output/server — run `pnpm build` first');
}

console.log(
    `native-electron: better-sqlite3 ${version} for electron ${electronVersion} (abi ${abi}) ${platform}-${arch}`
);

rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

for (const entry of ['package.json', 'binding.gyp', 'src', 'deps', 'lib']) {
    const from = path.join(source, entry);

    if (existsSync(from)) {
        cpSync(from, path.join(work, entry), { recursive: true });
    }
}

const prebuildInstall = require_.resolve('prebuild-install/bin.js', {
    paths: [source, root],
});

const download = spawnSync(
    process.execPath,
    [
        prebuildInstall,
        '--runtime=electron',
        `--target=${electronVersion}`,
        `--platform=${platform}`,
        `--arch=${arch}`,
        '--tag-prefix=v',
    ],
    { cwd: work, stdio: 'inherit' }
);

const built = path.join(work, 'build/Release/better_sqlite3.node');

if (download.status !== 0 || !existsSync(built)) {
    fail(
        `prebuild-install found no binary for electron ${electronVersion} (abi ${abi}) ${platform}-${arch}.\n` +
            '  better-sqlite3 12.x publishes prebuilds up to abi 146 (electron 42).\n' +
            '  Either stay on electron 42.x, or build from source with a C++ toolchain.'
    );
}

cpSync(built, target);
console.log(`native-electron: wrote ${path.relative(root, target)}`);
