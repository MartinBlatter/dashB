import path from 'node:path';
import process from 'node:process';
import { applyMigrations } from '../electron/database.mjs';

const root = path.resolve(import.meta.dirname, '..');
const server = path.join(root, '.output/server');
const url = process.env.DATABASE_URL;

if (url === undefined || !url.startsWith('file:')) {
    console.error(
        'apply-migrations: DATABASE_URL must be a file: URL, e.g. file:/app/data/dashb.db'
    );
    process.exit(1);
}

const target = url.slice('file:'.length);

if (target.length === 0) {
    console.error('apply-migrations: DATABASE_URL names no file');
    process.exit(1);
}

try {
    const applied = applyMigrations({
        entry: path.join(server, 'node_modules/better-sqlite3/lib/index.js'),
        binding: path.join(
            server,
            'node_modules/better-sqlite3/build/Release/better_sqlite3.node'
        ),
        file: path.isAbsolute(target) ? target : path.join(root, target),
        migrations: path.join(root, 'migrations'),
    });

    console.log(
        applied.length === 0
            ? 'apply-migrations: database already up to date'
            : `apply-migrations: applied ${applied.join(', ')}`
    );
} catch (error) {
    console.error(
        `apply-migrations: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
}
