import electron from 'electron';
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import { applyMigrations } from './database.mjs';
import {
    betterSqlite3Entry,
    crashFile,
    databaseFile,
    logFile,
    migrationsDir,
    nativeBinding,
    secretFile,
    serverDir,
    serverEntry,
} from './paths.mjs';
import { loadSecret, localCredentials } from './secrets.mjs';
import { choosePort, startServer, waitForServer } from './server.mjs';
import { applySession, createSession } from './session.mjs';

const { BrowserWindow, app, dialog, session, shell } = electron;

const preferredPort = 37591;
const portAttempts = 12;
const startupTimeout = 30000;
const externalProtocols = new Set(['http:', 'https:', 'mailto:']);

let serverProcess = null;
let mainWindow = null;
let quitting = false;

if (!app.requestSingleInstanceLock()) {
    app.quit();
}

function openExternal(url) {
    try {
        if (externalProtocols.has(new URL(url).protocol)) {
            void shell.openExternal(url);
        }
    } catch {
        return;
    }
}

function isInternal(url, origin) {
    return url.startsWith(`${origin}/`) || url === origin;
}

function createWindow(origin) {
    const window = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 640,
        minHeight: 480,
        show: false,
        autoHideMenuBar: true,
        backgroundColor: '#1a1b1e',
        title: 'DashB',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            nodeIntegrationInSubFrames: false,
            sandbox: true,
            webviewTag: false,
        },
    });

    window.once('ready-to-show', () => window.show());

    window.webContents.setWindowOpenHandler(({ url }) => {
        openExternal(url);

        return { action: 'deny' };
    });

    const guard = (event, url) => {
        if (!isInternal(url, origin)) {
            event.preventDefault();
            openExternal(url);
        }
    };

    window.webContents.on('will-navigate', guard);
    window.webContents.on('will-frame-navigate', (event) => {
        if (!event.isMainFrame) {
            return;
        }

        guard(event, event.url);
    });

    return window;
}

function stopServer() {
    if (serverProcess === null) {
        return;
    }

    const child = serverProcess;

    serverProcess = null;
    child.kill();
}

async function resolveOrigin() {
    const override = process.env.DASHB_DEV_URL;

    if (override !== undefined && override !== '') {
        return { origin: override.replace(/\/+$/, ''), spawned: false };
    }

    const secret = loadSecret(secretFile());
    const database = databaseFile();

    applyMigrations({
        entry: betterSqlite3Entry(),
        binding: nativeBinding(),
        migrations: migrationsDir(),
        file: database,
    });

    const port = await choosePort(preferredPort, portAttempts);
    const origin = `http://127.0.0.1:${port}`;

    serverProcess = startServer({
        entry: serverEntry(),
        cwd: serverDir(),
        port,
        database,
        secret,
        origin,
        log: logFile(),
    });

    serverProcess.on('exit', (code) => {
        if (quitting || serverProcess === null) {
            return;
        }

        serverProcess = null;
        dialog.showErrorBox(
            'DashB',
            `The DashB server stopped unexpectedly (code ${code}).\nSee ${logFile()}`
        );
        app.quit();
    });

    return { origin, spawned: true };
}

async function startup() {
    const { origin } = await resolveOrigin();

    await waitForServer(origin, startupTimeout);

    const credentials = localCredentials(loadSecret(secretFile()));
    const cookies = await createSession(origin, credentials);

    await applySession(session.defaultSession.cookies, origin, cookies);

    mainWindow = createWindow(origin);

    await mainWindow.loadURL(`${origin}/`);
}

app.on('second-instance', () => {
    if (mainWindow === null) {
        return;
    }

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }

    mainWindow.focus();
});

app.on('window-all-closed', () => app.quit());

app.on('before-quit', () => {
    quitting = true;
    stopServer();
});

function reportStartupFailure(error) {
    const detail =
        error instanceof Error ? (error.stack ?? error.message) : String(error);

    stopServer();

    try {
        writeFileSync(
            crashFile(),
            `${new Date().toISOString()}
${detail}
`,
            { flag: 'a' }
        );
    } catch {
        process.exitCode = 1;
    }

    console.error(detail);
    dialog.showErrorBox(
        'DashB',
        `Failed to start:

${detail}`
    );
    app.exit(1);
}

app.whenReady().then(startup).catch(reportStartupFailure);
