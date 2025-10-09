import db from '../../lib/database.js'


let handler = async (m, { conn, args, isAdmin }) => {

	let who
    if (m.isGroup) who = args[1] ? args[1] : m.chat
    else who = args[1]

	if (isAdmin) {
		let grup = args[1] ? args[1] : m.isGroup ? m.chat : ''
		if (!grup) throw `Group only`
		let chat = db.data.chats[who]
		if (!chat) return m.reply(`Group only`)
		chat.isBanned = false
		await conn.reply(grup, `Bot di *unmute*`)
	} else throw `*「ADMIN ONLY」*`
}

handler.menugroup = ['unmutebot']
handler.menuowner = ['unmutebot']
handler.tagsgroup = ['group']
handler.tagsowner = ['owner']
handler.command = /^(unmutebot)$/i

handler.help = ['unmutebot'];
handler.tags = ['Menu Group'];

handler.admin = true

export default handler