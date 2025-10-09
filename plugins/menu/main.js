import db from '../../lib/database.js'
import { plugins } from '../../lib/plugins.js'
import { readMore } from '../../lib/func.js'

let tags = {
	'submenu': 'SUB MENU',
	'tram': 'Menu Toram',
	'tguide': 'TORAM GUIDE',
	'tnews': 'TORAM NEWS',
	'ai': 'AI',
	'information': 'INFORMATION',
	'tools': 'TOOLS MENU',
}

const defaultMenu = {
	before: `
	\n%readmore`.trimStart(),
	header: '╭─「 *%category* 」',
	body: '│ • %cmd',
	footer: '╰────\n',
}

let handler = async (m, { conn, usedPrefix: _p }) => {

	const res = await fetch(global.API("zax", "/api/etc/thumbnail", { type: 'large' }, "apikey"), { responseType: 'arraybuffer' });
	const arrayBuffer = await res.arrayBuffer();
	global.thumbnail = Buffer.from(arrayBuffer);
	global.imageId = res.headers.get("x-image-id");
	
	try {
		let name = await conn.getName(m.sender).replaceAll('\n', '')
		let nomor = `${m.sender.split`@`[0]}`

		let help = Object.values(plugins).filter(plugin => !plugin.disabled).map(plugin => {
			return {
				help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
				tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
				prefix: 'customPrefix' in plugin,
				enabled: !plugin.disabled,
			}
		})
		for (let plugin of help)
			if (plugin && 'tags' in plugin)
				for (let tag of plugin.tags)
					if (!(tag in tags) && tag) tags[tag] = tag
		conn.menu = conn.menu ? conn.menu : {}
		let before = conn.menu.before || defaultMenu.before
		let header = conn.menu.header || defaultMenu.header
		let body = conn.menu.body || defaultMenu.body
		let footer = conn.menu.footer || defaultMenu.footer
		let _text = [
			before.replace(),
			...Object.keys(tags).map(tag => {
				const cmds = []
				for (const menu of help) {
					if (!(menu.tags && menu.tags.includes(tag) && menu.help)) continue
					const listRaw = Array.isArray(menu.help) ? menu.help : [menu.help]

					const list = listRaw.flat ? listRaw.flat() : listRaw.reduce((a, v) => a.concat(v), [])

					for (const h of list) {
						if (!h) continue
						cmds.push({
							text: String(h),
							prefix: menu.prefix,
						})
					}
				}

				const bodyLines = cmds
					.sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()))
					.map(cmd => body
						.replace(/%cmd/g, cmd.prefix ? cmd.text : '%p' + cmd.text)
						.trim()
					)
					.join('\n')

				return header.replace(/%category/g, tags[tag]) + '\n' + [
					bodyLines,
					footer
				].join('\n')
			}),
		].join('\n')

		let text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
		let replace = {
			'%': '%',
			p: _p,
			me: conn.getName(conn.user.jid),
			name, nomor,
			readmore: readMore
		}

		text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])

		let txtList = `*All Bot List:*
https://kinda.icu/
		
*Grup (Bebas pake all fitur):*
chat.whatsapp.com/Fx62AohmN9iAijz4ZtmzwA

*Channel (Info update):*
whatsapp.com/channel/0029VagxpVB6hENrC5nZ6K1k

*RULES:*
- Bot ini untuk keperluan toram, gunakan fitur lain sewajarnya
- Bot hanya untuk GC Toram
- Dilarang membuat stiker jomok / 18+
- Melanggar = Mute/Banned
- Kirim req melalui .saran\n\n`

		conn.relayMessage(m.chat, {
			extendedTextMessage: {
				text: txtList + text.trim(),
				contextInfo: {
					mentionedJid: [m.sender],
					externalAdReply: {
						title: 'Hello ' + name,
						body: global.wish,
						mediaType: 1,
						previewType: 0,
						renderLargerThumbnail: true,
						thumbnail: global.thumbnail,
						thumbnailUrl: `https://kinda.icu/redir/${global.imageId}`,
					}
				}, mentions: [m.sender]
			}
		}, { quoted: fkontak });

	} catch (e) {
		console.log(e)
	}
}

handler.command = /^((all)?m(enu)?|help|\?)$/i


export default handler