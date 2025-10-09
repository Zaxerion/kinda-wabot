import db from '../../lib/database.js'

let handler = async (m, { conn, command }) => {
	await conn.reply(m.chat, `https://chat.whatsapp.com/Fx62AohmN9iAijz4ZtmzwA`, m)
}

handler.menugroup = ['linkgcbot']
handler.tagsgroup = ['group']
handler.command = /^((komunitas)?(gc|gro?up)bot)$/i

export default handler