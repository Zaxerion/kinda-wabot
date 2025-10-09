import { readMore } from '../../lib/func.js'
import { plugins } from '../../lib/plugins.js'

let tagstoram = {
    'sram': 'Toram Simulator',
    'tram': 'Toram Search',
    'stram': 'Toram Stats Search',
	'itram': 'Toram Info',
	'gtram': 'Toram Guide',
	'news': 'Toram News',
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
		let menutoram = Object.values(plugins).filter(plugin => !plugin.disabled).map(plugin => {
			return {
				menutoram: Array.isArray(plugin.tagstoram) ? plugin.menutoram : [plugin.menutoram],
				tagstoram: Array.isArray(plugin.tagstoram) ? plugin.tagstoram : [plugin.tagstoram],
				prefix: 'customPrefix' in plugin,
				enabled: !plugin.disabled,
			}
		})
		for (let plugin of menutoram)
			if (plugin && 'tagstoram' in plugin)
				for (let tag of plugin.tagstoram)
					if (!(tag in tagstoram) && tag) tagstoram[tag] = tag
		conn.torammenu = conn.torammenu ? conn.torammenu : {}
		let before = conn.torammenu.before || defaultMenu.before
		let header = conn.torammenu.header || defaultMenu.header
		let body = conn.torammenu.body || defaultMenu.body
		let footer = conn.torammenu.footer || defaultMenu.footer
		let _text = [
			before,
			...Object.keys(tagstoram).map(tag => {
				return header.replace(/%category/g, tagstoram[tag]) + '\n' + [
					...menutoram.filter(torammenu => torammenu.tagstoram && torammenu.tagstoram.includes(tag) && torammenu.menutoram).map(torammenu => {
						return torammenu.menutoram.map(menutoram => {
							return body.replace(/%cmd/g, torammenu.prefix ? menutoram : '%p' + menutoram)
								.trim()
						}).join('\n')
					}),
					footer
				].join('\n')
			})
		].join('\n')
		let text = typeof conn.torammenu == 'string' ? conn.torammenu : typeof conn.torammenu == 'object' ? _text : ''
		let replace = {
			p: _p,
			'%': '%',
			readmore: readMore
		}
		text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
		let name = await conn.getName(m.sender).replaceAll('\n', '')
		await conn.sendFThumb(m.chat, 'Hello ' + name, global.wish, text.replace(`si <character>`, `si <character>${readMore}`).trim(), global.thumbnail, `https://kinda.icu/redir/${global.imageId}`, m)
	} catch (e) {
		console.log(e)
	}
}

handler.help = ['menutoram']
handler.tags = ['submenu']
handler.command = /^(toramm(enu)?|m(enu)?toram)$/i

export default handler