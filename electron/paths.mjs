import electron from 'electron';
import path from 'node:path';
import process from 'node:process';

const { app } = electron;

function projectRoot() {
    return path.join(app.getAppPath(), '..');
}

export function serverDir() {
    return app.isPackaged
        ? path.join(process.resourcesPath, 'output/server')
        : path.join(projectRoot(), '.output/server');
}

export function migrationsDir() {
    return app.isPackaged
        ? path.join(process.resourcesPath, 'migrations')
        : path.join(projectRoot(), 'migrations');
}

export function serverEntry() {
    return path.join(serverDir(), 'index.mjs');
}

export function nativeBinding() {
    return path.join(
        serverDir(),
        'node_modules/better-sqlite3/build/Release/better_sqlite3.node'
    );
}

export function betterSqlite3Entry() {
    return path.join(serverDir(), 'node_modules/better-sqlite3/lib/index.js');
}

export function databaseFile() {
    return path.join(app.getPath('userData'), 'dashb.db');
}

export function secretFile() {
    return path.join(app.getPath('userData'), 'secret');
}

export function logFile() {
    return path.join(app.getPath('userData'), 'server.log');
}

export function crashFile() {
    return path.join(app.getPath('userData'), 'startup-error.log');
}
