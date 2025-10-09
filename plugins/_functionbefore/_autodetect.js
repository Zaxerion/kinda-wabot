import { WAMessageStubType } from 'baileys'

export async function before(m) {
	if (!m.messageStubType || !m.isGroup) return !1
	let edtr = `@${m.sender.split`@`[0]}`	
	if (m.messageStubType == 21) {
		//await this.sendMsg(m.chat, { text: `${edtr} mengubah Subject Grup menjadi :\n*${m.messageStubParameters[0]}*`, mentions: [m.sender] })
	} else if (m.messageStubType == 22) {
		//await this.sendMsg(m.chat, { text: `${edtr} telah mengubah icon grup.`, mentions: [m.sender] })
	} else if (m.messageStubType == 24) {
		//await this.sendMsg(m.chat, { text: `${edtr} mengubah deskripsi grup.\n\n${m.messageStubParameters[0]}`, mentions: [m.sender] })
	} else if (m.messageStubType == 25) {
		//await this.sendMsg(m.chat, { text: `${edtr} telah mengatur agar *${m.messageStubParameters[0] == 'on' ? 'hanya admin' : 'semua peserta'}* yang dapat mengedit info grup.`, mentions: [m.sender] })
	} else if (m.messageStubType == 26) {
		const ms = /on/.test(m.messageStubParameters[0])
		//await this.sendMsg(m.chat, { text: `${edtr} telah *${ms ? 'menutup' : 'membuka'}* grup!\nSekarang ${ms ? 'hanya admin yang' : 'semua peserta'} dapat mengirim pesan.`, mentions: [m.sender] })
	} else if (m.messageStubType == 28) {
		await this.sendMsg(m.chat, { text: `${edtr} telah mengeluarkan @${m.messageStubParameters[0].split`@`[0]} dari grup.`, mentions: [m.sender, m.messageStubParameters[0]] })
	} else if (m.messageStubType == 29) {
		//await this.sendMsg(id, { text: `${edtr} telah menjadikan @${m.messageStubParameters[0].split`@`[0]} sebagai admin.`, mentions: [m.sender, m.messageStubParameters[0]] })
	} else if (m.messageStubType == 30) {
		//await this.sendMsg(id, { text: `@${user.split`@`[0]} telah diberhentikan sebagai admin.`, mentions: [user] })
	} else if (m.messageStubType == 72) {
		//await this.sendMsg(m.chat, { text: `${edtr} mengubah durasi pesan sementara menjadi *@${m.messageStubParameters[0]}*`, mentions: [m.sender] })
	} else if (m.messageStubType == 123) {
		//await this.sendMsg(m.chat, { text: `${edtr} *menonaktifkan* pesan sementara.`, mentions: [m.sender] })
	} else if (m.messageStubType == 145) {
		const ms = /on/.test(m.messageStubParameters[0])
		//await this.sendMsg(m.chat, { text: `${edtr} *${ms ? 'mengaktifkan' : 'menonaktifkan'}* 'MEMBERSHIP_JOIN_APPROVAL_MODE'.`, mentions: [m.sender] })
	}
	 else {
		console.log({
			messageStubType: m.messageStubType,
			messageStubParameters: m.messageStubParameters,
			type: WAMessageStubType[m.messageStubType],
		});
	}
	return !1
}

export const disabled = false