import uploadImage from '../../lib/uploadImage.js'
import fs from 'fs'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'

let handler = async (m, { conn, text, usedPrefix, command }) => {
	let q = m.quoted ? m.quoted : m
	let mime = (q.msg || q).mimetype || q.mediaType || ''
	if (!/image\/(jpe?g|png|webp)/.test(mime)) throw `Tag gambar / stiker dengan caption *${usedPrefix + command} atas|bawah* atau tag gambar yang sudah dikirim`
	if (!text) throw `Usage : ${usedPrefix + command} text1|text2\n\nExample: *${usedPrefix + command} Shiro|Neko*`
	let [l, r] = text.split`|`
	if (!l) l = '-'
	if (!r) r = '-'
	let img = await q.download?.()
	if (!img) {
		m.reply('Media file could not be downloaded or does not exist');
	}	  
	const imageUrl = await uploadImage(img);
	
	try {
		let res = `https://api.memegen.link/images/custom/${encodeURIComponent(l)}/${encodeURIComponent(r)}.png?background=${imageUrl}`
		let sticker = new Sticker(res, { pack: packname, author: author, type: StickerTypes.FULL })
		let ztick = await sticker.toBuffer()
		await conn.sendFile(m.chat, ztick, '', '', m)
	} catch (e) {
		console.log(e)
		await m.reply("erorr")
	}
}

handler.help = ['smeme <teks1>|<teks2>']
handler.tags = ['Menu Sticker']
handler.command = /^(s(tic?ker)?meme)$/i

export default handler