import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import Helper from './lib/helper.js'
import "dotenv/config";

global.nomorown = '6285157571221'
global.mods = ['6285157571221']
global.nomorbot = 'xxxxx'

global.db = Helper.opts['dev'] ? '' : 'MONGODB_URL'

global.APIs = {
	zax: 'https://kinda-apis.vercel.app'
}

global.APIKeys = {
	'https://kinda-apis.vercel.app': ''
}

global.wait = '```Loading...```'
global.eror = '```404 error```'

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '')


const res = await fetch(global.API("zax", "/api/etc/thumbnail", { type: 'large' }, "apikey"), { responseType: 'arraybuffer' });
const arrayBuffer = await res.arrayBuffer();
global.thumbnail = Buffer.from(arrayBuffer);
global.imageId = res.headers.get("x-image-id");

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
	unwatchFile(file)
	console.log(chalk.redBright("Update 'config.js'"))
	import(`${file}?update=${Date.now()}`)
})
