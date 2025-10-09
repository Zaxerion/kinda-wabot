import db from '../../lib/database.js'
import { delay } from '../../lib/func.js'

/*

export async function before(m, { isAdmin, text, isBotAdmin }) {
	if (!m.isGroup || !isBotAdmin || isAdmin) return !1
	if (!db.data.chats[m.chat]?.antitagsw) return !1
	if (m.message?.groupStatusMentionMessage ||
		m.message?.protocolMessage?.type === 25 ||
		m.message?.protocolMessage?.type === 'STATUS_MENTION_MESSAGE' ||
		m.mtype === 'groupStatusMentionMessage') {
		await this.sendMsg(m.chat, { delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.key.id, participant: m.sender } })
		await this.reply(m.chat, `@${(m.sender || '')
			.replace(/@s\.whatsapp\.net/g, '')} gausah mention group!`, fkontak, { mentions: [m.sender] })
		//await delay(3000)
		//await this.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
	}
	return !1
}
*/