import db from '../../lib/database.js'

let handler = async (m, { args }) => {
	let id = args[0] ? args[0] : m.isGroup ? m.chat : ''
	if (!id) throw `input group id !`
	let chat = db.data.chats[id]
	if (!chat) return m.reply(`[!] Invalid ID Group`)
	chat.isBanned = true
	chat.permaBan = true
	chat.spamcount = 0
	chat.lastmute = 0
	chat.mutecd = 0
	await m.reply('Bot dalam mode nyimak.')
}

handler.menuowner = ['bangc']
handler.tagsowner = ['owner']
handler.command = /^(bangc)$/i

handler.owner = true

export default handler