import db from '../../lib/database.js'
import Connection from '../../lib/connection.js'
import { padLead, ranNumb } from '../../lib/func.js'
import knights from '@zaxerion/k-canvas';

let meh = padLead(ranNumb(43), 3)
const thumb = 'https://raw.githubusercontent.com/dayoyui/dbs/refs/heads/main/media/avatar_contact.jpg'

let handler = async (m, { conn, args }) => {
	let tx = (args[0] || '').toLowerCase()
	let user = db.data.users[m.sender]
	let chat = db.data.chats[m.chat]
	if (/welcome|leave|bye/.test(tx)) {
		let meta, add = /welcome/.test(tx) ? true : false
		let namegc = m.isGroup ? await conn.getName(m.chat) : '~NamaGroup'
		if (m.isGroup) meta = await Connection.store.fetchGroupMetadata(m.chat, conn.groupMetadata)
		let text = (add ? (chat?.sWelcome || conn.welcome || Connection.conn.welcome || 'Welcome, @user!').replace('@subject', namegc).replace('@desc', meta?.desc?.toString() || '~group deskripsi') : (chat?.sBye || conn.bye || Connection.conn.bye || 'Bye, @user!')).replace('@user', '@' + m.sender.split('@')[0])
		try {
			let bg = `https://raw.githubusercontent.com/dayoyui/dbs/main/media/picbot/menus/menus_${meh}.jpg`
			let name = await conn.getName(m.sender)
			let pp = thumb
			let ppgc = thumb

			if (/welcome/.test(tx)) {

				const image = await new knights.Welcome2()
					.setAvatar(pp)
					.setUsername(name)
					.setBg(bg)
					.setGroupname(namegc)
					.setMember('60')
					.toAttachment();

				const data = image.toBuffer();
				await conn.sendFile(m.chat, data, '', text, false,  m, { mentions: [m.sender] })
				console.log(m.sender)	
			} else if (/leave|bye/.test(tx)) {
				const image = await new knights.Goodbye2()
					.setAvatar(pp)
					.setUsername(name)
					.setBg(bg)
					.setMember('60')
					.toAttachment();
				
				const data = image.toBuffer();

				await conn.sendFile(m.chat, data, '', text, false, m, { mentions: [m.sender] })
			}

		} catch (e) {
			console.log(e)
			await conn.reply(m.chat, text, fkontak, { mentions: [m.sender] })
		}
	} else if (/f(kontak(bot)?|troli|vn|vid)/.test(tx)) {
		await conn.reply(m.chat, `Halo @${m.sender.split('@')[0]}, ini simulasi ${tx}`, /troli/.test(tx) ? ftroli : /vn/.test(tx) ? fvn : /vid/.test(tx) ? fvid : /bot/.test(tx) ? fkontakbot : fkontak, { mentions: [m.sender] })
	}

	else m.reply(`*Emulate tersedia :*\n\nwelcome | leave | fkontak | fkontakbot | ftroli | fvn | fvid `)
}

handler.menugroup = ['emulate']
handler.tagsgroup = ['group']
handler.command = /^(emulate|simulasi)$/i

export default handler