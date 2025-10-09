let handler = async (m, { conn, text }) => {
	if (!text) throw 'masukkan nama grup'
	await conn.groupUpdateSubject(m.chat, text)
}

handler.menugroup = ['setnamegc']
handler.tagsgroup = ['group']
handler.command = /^(setname(gc|gro?up)?)$/i

handler.admin = true
handler.botAdmin = true
handler.group = true

handler.help = ['setnamegc'];
handler.tags = ['Menu Group'];

export default handler