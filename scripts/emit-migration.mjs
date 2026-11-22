import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require_ = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'migrations');

mkdirSync(dir, { recursive: true });

const existing = readdirSync(dir, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory()
);

if (existing.length > 0) {
    const hint = [
        `emit-migration: ${existing.length} migration(s) already present.`,
        'To add one, diff the new schema against the applied migrations:',
        '  prisma migrate diff --from-migrations migrations',
        '      --to-schema prisma/schema.prisma --script',
        '      --shadow-database-url "file:./shadow.db"',
        '      -o migrations/<n>_<name>/migration.sql',
    ];

    console.log(hint.join('\n'));
    process.exit(0);
}

const prismaCli = require_.resolve('prisma/build/index.js', { paths: [root] });

const result = spawnSync(
    process.execPath,
    [
        prismaCli,
        'migrate',
        'diff',
        '--from-empty',
        '--to-schema',
        path.join(root, 'prisma/schema.prisma'),
        '--script',
    ],
    {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, DATABASE_URL: 'file:./unused.db' },
    }
);

if (result.status !== 0) {
    console.error(
        result.error?.message ?? result.stderr ?? 'prisma migrate diff failed'
    );
    process.exit(1);
}

const sql = result.stdout.trim();

if (!sql.includes('CREATE TABLE')) {
    console.error('emit-migration: prisma produced no CREATE TABLE statements');
    process.exit(1);
}

const target = path.join(dir, '0_init');

mkdirSync(target, { recursive: true });

const file = path.join(target, 'migration.sql');

writeFileSync(file, `${sql}\n`, 'utf8');

const tables = sql.match(/CREATE TABLE/g)?.length ?? 0;
const indexes = sql.match(/CREATE (UNIQUE )?INDEX/g)?.length ?? 0;

console.log(
    `emit-migration: wrote ${path.relative(root, file)} (${tables} tables, ${indexes} indexes)`
);
