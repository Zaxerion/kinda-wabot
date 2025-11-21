import * as os from 'os'
import chalk from 'chalk'
import db, { loadDatabase } from './database.js'
import fs from 'fs'
import Helper from './helper.js'
import importFile from './import.js'
import open from 'open'
import P from 'pino'
import path, { resolve } from 'path'
import readline from 'readline'
import storeSystem from './store.js'
import { fileURLToPath } from 'url'
import { HelperConnection } from './simple.js'
import qrcode from 'qrcode-terminal'

import {
    default as makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore
} from 'baileys'

const Device = (os.platform() === 'win32') ? 'Windows' : (os.platform() === 'darwin') ? 'MacOS' : 'Linux'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authFolder = storeSystem.fixFileName(`${Helper.opts._[0] || ''}sessions`)
const authFile = `${Helper.opts._[0] || 'session'}.data.json`
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))
const usePairingCode = Helper.opts['pairing']

let [
    isCredsExist,
    isAuthSingleFileExist,
    authStateRaw
] = await Promise.all([
    Helper.checkFileExists(authFolder + '/creds.json'),
    Helper.checkFileExists(authFile),
    useMultiFileAuthState(authFolder)
])

const authState = {
    state: {
         creds: {
            ...authStateRaw.state.creds
        },
        keys: makeCacheableSignalKeyStore(authStateRaw.state.keys, P({ level: 'silent' }))
    },
    saveCreds: authStateRaw.saveCreds
}

const store = storeSystem.makeInMemoryStore()
const storeFile = `${Helper.opts._[0] || 'data'}.store.json`
store.readFromFile(storeFile)

// from: https://github.com/whiskeysockets/baileys/blob/master/src/Utils/logger.ts
const logger = P({
    timestamp: () => `,"time":"${new Date().toJSON()}"`,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
}).child({ class: 'baileys' })


const connectionOptions = {
    syncFullHistory: false,
    auth: authState.state
}


async function fetchLatestWaWebVersion() {
    try {
        const res = await fetch("https://web.whatsapp.com/sw.js", {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Sec-Fetch-Site": "none",
            }
        });

        const text = await res.text();

        const match = text.match(/["\\]*client_revision["\\]*\s*:\s*(\d+)/);

        if (!match) {
            return {
                version: null,
                isLatest: false,
                error: "client_revision not found"
            };
        }

        const rev = Number(match[1]);

        return {
            waversion: [2, 3000, rev],
            isLatest: true
        };

    } catch (err) {
        return {
            waversion: [2, 3000, 1029890518],
            isLatest: false,
            error: err.message
        };
    }
}

async function getLatestChromeStable() {
    const url = "https://versionhistory.googleapis.com/v1/chrome/platforms/win/channels/stable/versions";

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch Chrome version API");

    const data = await res.json();

    const latest = data.versions[0].version; 
    return latest;
}

let conns = new Map();

async function start(oldSocket = null, opts = { store, logger, authState }) {
    let { waversion, isLatest } = await fetchLatestWaWebVersion();
    let chrome = await getLatestChromeStable();
    console.log(chalk.magenta(`-- using WA v${waversion.join('.')}, isLatest: ${isLatest} --`))

    let conn = await makeWASocket({
        version: waversion,
        ...connectionOptions,
        ...opts.connectionOptions,
        logger: opts.logger,
        auth: opts.authState.state,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false,
        defaultQueryTimeoutMs: undefined,
        browser: [Device, 'Chrome', chrome]
    })
    HelperConnection(conn, { store: opts.store, logger })

    if (oldSocket) {
        conn.isInit = oldSocket.isInit
        conn.isReloadInit = oldSocket.isReloadInit
    }
    if (conn.isInit == null) {
        conn.isInit = false
        conn.isReloadInit = true
    }

    store.bind(conn.ev, {
        groupMetadata: conn.groupMetadata
    })

    if (usePairingCode && isCredsExist && !conn.authState.creds.registered) {
        console.log(chalk.yellow('-- WARNING: creds.json is broken, please delete it first --'))
        process.exit(0)
    }

    if (usePairingCode && !conn.authState.creds.registered) {
        const { registration } = { registration: {} }
        const PHONE_CC = await (await fetch('https://raw.githubusercontent.com/clicknetcafe/json-db/refs/heads/main/data/countryphonecode.json')).json()
        let phoneNumber = global.nomorbot
        if (!PHONE_CC.map(v => v.code).some(v => phoneNumber.startsWith(v))) {
            throw new Error('Invalid phone number format.');
        }
        rl.close()
        phoneNumber = phoneNumber.replace(/\D/g, '')
        console.log(chalk.bgWhite(chalk.blue('-- Please wait, generating code... --')))
        setTimeout(async () => {
            let code = await conn.requestPairingCode(phoneNumber)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
        }, 3000)
    }

    await reload(conn, false, opts).then((success) => console.log('- bind handler event -', success))

    conn.ev.on('lid-mapping.update', (m) => {
        console.log('LID mapping updated:', m)
    })

    return conn
}

let OldHandler = null
async function reload(conn, restartConnection, opts = { store, logger, authState }) {
    if (!opts.handler) opts.handler = importFile(Helper.__filename(resolve('./handler.js'))).catch(console.error)
    if (opts.handler instanceof Promise) opts.handler = await opts.handler;
    if (!opts.handler && OldHandler) opts.handler = OldHandler
    OldHandler = opts.handler

    const isReloadInit = !!conn.isReloadInit
    if (restartConnection) {
        try { conn.ws.close() } catch { }
        conn.ev.removeAllListeners()
        Object.assign(conn, await start(conn, opts) || {})
    }

    Object.assign(conn, getMessageConfig())

    if (!isReloadInit) {
        if (conn.handler) conn.ev.off('messages.upsert', conn.handler)
        if (conn.participantsUpdate) conn.ev.off('group-participants.update', conn.participantsUpdate)
        if (conn.groupsUpdate) conn.ev.off('groups.update', conn.groupsUpdate)
        if (conn.onDelete) conn.ev.off('messages.delete', conn.onDelete)
        if (conn.connectionUpdate) conn.ev.off('connection.update', conn.connectionUpdate)
        if (conn.credsUpdate) conn.ev.off('creds.update', conn.credsUpdate)
    }
    if (opts.handler) {
        conn.handler = opts.handler.handler.bind(conn)
        conn.participantsUpdate = opts.handler.participantsUpdate.bind(conn)
        conn.groupsUpdate = opts.handler.groupsUpdate.bind(conn)
        conn.onDelete = opts.handler.deleteUpdate.bind(conn)
    }
    if (!opts.isChild) conn.connectionUpdate = connectionUpdate.bind(conn, opts)
    conn.credsUpdate = opts.authState.saveCreds.bind(conn)

    
    conn.ev.on('messages.upsert', (conn).handler)
    conn.ev.on('group-participants.update', (conn).participantsUpdate)
    conn.ev.on('groups.update', (conn).groupsUpdate)
    conn.ev.on('messages.delete', (conn).onDelete)
    if (!opts.isChild) conn.ev.on('connection.update', (conn).connectionUpdate)
    conn.ev.on('creds.update', (conn).credsUpdate)

    conn.isReloadInit = false
    return true
}

async function connectionUpdate(opts, update) {
    const { connection, lastDisconnect, isNewLogin } = update
    const code = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

    if (update.qr && !usePairingCode) {
        console.log(chalk.yellow('-- Scan QR below to login --'))
        qrcode.generate(update.qr, { small: true })
    }

    if (connection === 'close') {
        if (code) {
            try {
                console.log('- Connection Closed, Reconnecting -')
                await reload(this, true, opts)
                global.timestamp.connect = new Date
            } catch (e) {
                console.log('-- ERROR LOG --')
                console.log(e)
            }
        } else {
            console.log(chalk.red('-- Device loggedOut --'))
            process.exit(0)
        }
    } else if (connection == 'open') console.log('- opened connection -')
    if (db.data == null) loadDatabase()
}

function getMessageConfig() {
    const welcome = 'Hai, @user!\nSelamat datang di grup @subject\n\n@desc'
    const bye = 'Selamat tinggal @user!'
    const spromote = '@user sekarang admin!'
    const sdemote = '@user sekarang bukan admin!'
    const sDesc = 'Deskripsi telah diubah ke \n@desc'
    const sSubject = 'Judul grup telah diubah ke \n@subject'
    const sIcon = 'Icon grup telah diubah!'
    const sRevoke = 'Link group telah diubah ke \n@revoke'

    return {
        welcome,
        bye,
        spromote,
        sdemote,
        sDesc,
        sSubject,
        sIcon,
        sRevoke
    }
}

const conn = start(null, { store, logger, authState })
    .catch(console.error)

export default {
    start,
    reload,

    conn,
    conns,
    logger,
    connectionOptions,

    authFolder,
    storeFile,
    authState,
    store,

    getMessageConfig
}
export {
    conn,
    conns,
    logger
}
