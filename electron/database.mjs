import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const migrationsTable = `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
)`;

const recordMigration = `INSERT INTO "_prisma_migrations"
    (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
    VALUES (?, ?, ?, current_timestamp, current_timestamp, 1)`;

export function openDatabase(options) {
    const require_ = createRequire(import.meta.url);
    const Database = require_(options.entry);

    return new Database(options.file, { nativeBinding: options.binding });
}

export function applyMigrations(options) {
    const db = openDatabase(options);

    try {
        db.pragma('journal_mode = WAL');
        db.exec(migrationsTable);

        const applied = new Set(
            db
                .prepare(
                    'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL'
                )
                .all()
                .map((row) => row.migration_name)
        );

        const pending = readdirSync(options.migrations, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort()
            .filter((name) => !applied.has(name));

        const insert = db.prepare(recordMigration);

        for (const name of pending) {
            const sql = readFileSync(
                path.join(options.migrations, name, 'migration.sql'),
                'utf8'
            );
            const checksum = createHash('sha256').update(sql).digest('hex');

            db.exec('BEGIN');

            try {
                db.exec(sql);
                insert.run(randomUUID(), checksum, name);
                db.exec('COMMIT');
            } catch (error) {
                db.exec('ROLLBACK');

                throw new Error(`migration ${name} failed: ${error.message}`);
            }
        }

        return pending;
    } finally {
        db.close();
    }
}
