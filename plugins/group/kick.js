var handler = async (m, { conn, text, participants }) => {
    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : text ? (text.replace(/\D/g, '') + '@s.whatsapp.net') : ''
    if (!who || who == m.sender) throw 'Reply / tag yang ingin di kick'
    if (participants.filter(v => v.id == who || v.phoneNumber == who).length == 0) throw `Target tidak berada dalam Grup !`
	try {			
    	await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
        //.then(_ => m.reply(`Success`))
		} catch (e) {
			console.error('Kick failed:', e)
			m.reply('Gagal kick')
		}
}


handler.menugroup = ['kick']
handler.tagsgroup = ['group']
handler.command = /^(kick|tendang)$/i

handler.help = ['kick @tag'];
handler.tags = ['Menu Group'];

handler.admin = true
handler.botAdmin = true
handler.group = true

export default handler