import db from '../../lib/database.js'


let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isOwner, participants }) => {

	let who
    if (m.isGroup) who = args[1] ? args[1] : m.chat
    else who = args[1]

	if (isAdmin) {
		let grup = args[1] ? args[1] : m.isGroup ? m.chat : ''
		if (!grup) throw `input group id !`
		let chat = db.data.chats[who]
		if (!chat) return m.reply(`[!] Invalid ID Group`)
		chat.isBanned = true
		await conn.reply(grup, `Bot di *mute*, Hanya admin yang bisa pake.`)
	} else throw `*「ADMIN ONLY」*`
}

handler.menugroup = ['mutebot']
handler.tagsgroup = ['group']
handler.command = /^(mute(bot))$/i

handler.help = ['mutebot'];
handler.tags = ['Menu Group'];

handler.admin = true
handler.bot = true

export default handler