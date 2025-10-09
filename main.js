process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.on('uncaughtException', console.error)

import './config.js'
import cfonts from 'cfonts'
import Connection from './lib/connection.js'
import Helper from './lib/helper.js'
import db from './lib/database.js'
import clearTmp from './lib/clearTmp.js'
import { existsSync, mkdirSync } from 'fs'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { spawn } from 'child_process'
import { protoType, serialize } from './lib/simple.js'
import {
	loadPluginFiles,
	pluginFolder,
	pluginFilter
} from './lib/plugins.js'
import { updateAllData } from './lib/toramfetch.js';


await updateAllData()

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)
const args = [join(__dirname, 'main.js'), ...process.argv.slice(2)]
const { say } = cfonts
const { name, author } = require(join(__dirname, './package.json'))

say('Lightweight\nWhatsApp Bot', {
	font: 'chrome',
	align: 'center',
	gradient: ['red', 'magenta']
})
say(`'${name}' By @${author.name || author}`, {
	font: 'console',
	align: 'center',
	gradient: ['red', 'magenta']
})

say([process.argv[0], ...args].join(' '), {
	font: 'console',
	align: 'center',
	gradient: ['red', 'magenta']
})

function ensureTmpFolder() {
	const tmpRoot = join(__dirname, 'tmp');
	if (!existsSync(tmpRoot)) {
		mkdirSync(tmpRoot, { recursive: true });
		console.log('tmp folder created:', tmpRoot);
	} else {
		console.log('tmp folder already exists:', tmpRoot);
	}
}

ensureTmpFolder();
protoType()
serialize()

Object.assign(global, {
	...Helper,
	timestamp: {
		start: Date.now()
	}
})

const conn = Object.defineProperty(Connection, 'conn', {
	value: await Connection.conn,
	enumerable: true,
	configurable: true,
	writable: true
}).conn

loadPluginFiles(pluginFolder, pluginFilter, {
	logger: conn.logger,
	recursiveRead: true
}).then(_ => console.log("sukses"))
	.catch(console.error)

setInterval(async () => {
	await Promise.allSettled([
		db.data ? db.write() : Promise.reject('db.data is null'),
		clearTmp(),
	])
	console.log('DB saved')
}, 1000 * 60 * 5)

async function _quickTest() {
	let test = await Promise.all([
		spawn('ffmpeg'),
		spawn('ffprobe'),
		spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
		spawn('convert'),
		spawn('magick'),
		spawn('gm'),
		spawn('find', ['--version'])
	].map(p => {
		return Promise.race([
			new Promise(resolve => {
				p.on('close', code => {
					resolve(code !== 127)
				})
			}),
			new Promise(resolve => {
				p.on('error', _ => resolve(false))
			})
		])
	}))
	let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
	console.log(test)
	let s = global.support = {
		ffmpeg,
		ffprobe,
		ffmpegWebp,
		convert,
		magick,
		gm,
		find
	}
	Object.freeze(global.support)

	if (!s.ffmpeg) (conn?.logger || console).warn('Please install ffmpeg for sending videos (pkg install ffmpeg)')
	if (s.ffmpeg && !s.ffmpegWebp) (conn?.logger || console).warn('Stickers may not animated without libwebp on ffmpeg (--enable-libwebp while compiling ffmpeg)')
	if (!s.convert && !s.magick && !s.gm) (conn?.logger || console).warn('Stickers may not work without imagemagick if libwebp on ffmpeg doesnt isntalled (pkg install imagemagick)')
}

_quickTest()
	.then(() => (conn?.logger?.info || console.log)('Quick Test Done'))
	.catch(console.error)
