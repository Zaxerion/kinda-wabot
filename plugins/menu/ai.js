import { readMore } from '../../lib/func.js'
import { plugins } from '../../lib/plugins.js'

let tagsai = {
	'ai': 'Ai',
	'aikinda': 'AI Chat',
}
const defaultMenu = {
	before: `
`.trimStart(),
	header: '╭─「 %category 」',
	body: '│ • %cmd',
	footer: '╰────\n',
}
let handler = async (m, { conn, usedPrefix: _p, __dirname }) => {
	try {
		let name = await conn.getName(m.sender).replaceAll('\n', '')
		let menuai = Object.values(plugins).filter(plugin => !plugin.disabled).map(plugin => {
			return {
				menuai: Array.isArray(plugin.tagsai) ? plugin.menuai : [plugin.menuai],
				tagsai: Array.isArray(plugin.tagsai) ? plugin.tagsai : [plugin.tagsai],
				prefix: 'customPrefix' in plugin,
				enabled: !plugin.disabled,
			}
		})
		for (let plugin of menuai)
			if (plugin && 'tagsai' in plugin)
				for (let tag of plugin.tagsai)
					if (!(tag in tagsai) && tag) tagsai[tag] = tag
		conn.aimenu = conn.aimenu ? conn.aimenu : {}
		let before = conn.aimenu.before || defaultMenu.before
		let header = conn.aimenu.header || defaultMenu.header
		let body = conn.aimenu.body || defaultMenu.body
		let footer = conn.aimenu.footer || defaultMenu.footer
		let _text = [
			before,
			...Object.keys(tagsai).map(tag => {
				return header.replace(/%category/g, tagsai[tag]) + '\n' + [
					...menuai.filter(aimenu => aimenu.tagsai && aimenu.tagsai.includes(tag) && aimenu.menuai).map(aimenu => {
						return aimenu.menuai.map(menuai => {
							return body.replace(/%cmd/g, aimenu.prefix ? menuai : '%p' + menuai)
								.trim()
						}).join('\n')
					}),
					footer
				].join('\n')
			})
		].join('\n')
		let text = typeof conn.aimenu == 'string' ? conn.aimenu : typeof conn.aimenu == 'object' ? _text : ''
		let replace = {
			p: _p,
			'%': '%',
			readmore: readMore
		}
		text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
		await conn.sendFThumb(m.chat, 'Hello ' + name, global.wish, text.replace(`summer <text>`, `summer <text>${readMore}`).trim(), global.thumbnail, `https://kinda.icu/redir/${global.imageId}`, m)

	} catch (e) {
		console.log(e)
	}
}

handler.help = ['menuai']
handler.tags = ['submenu']
handler.command = /^(m(enu)?ai)$/i

export default handler