import db from '../../lib/database.js'
import { delay } from '../../lib/func.js'

function remM(text) {
	const regex = /@\d+(@g\.us)?/g
	return text.replace(regex, '')
}

let handler = async (m, { conn, command, text, isOwner, isAdmin, isBotAdmin, participants }) => {
	let warn = db.data.chats[m.chat].warn
	if (!warn) db.data.chats[m.chat].warn = {}

	if (/listwarn/.test(command)) {
		if (!isAdmin) return m.reply('*「ADMIN GROUP ONLY」*')
		let warnList = Object.entries(warn)
			.filter(([_, v]) => v.count > 0)
			.map(([jid, v], i) => `${i + 1}. @${jid.split('@')[0]} (${v.count}/3)${v.alasan ? ` - ${v.alasan}` : ''}`)
			.join('\n')

		let listText = warnList ? `*📛 Daftar Pengguna yang Diwarn:*\n\n${warnList}` : '✅ Tidak ada pengguna yang memiliki peringatan.'
		await conn.sendMsg(m.chat, { text: listText, mentions: conn.parseMention(listText) }, { quoted: m })
		return
	}

	let user = m.quoted?.sender ? m.quoted.sender : m.mentionedJid?.[0] ? m.mentionedJid[0] : /cek/.test(command) ? m.sender : ''
	if (!user) return m.reply('Siapa yang mau di-warn?')
	if (m.sender == user && !/cek/.test(command)) return m.reply('Tidak bisa me-warn diri sendiri.')

	let ow = db.data.datas
	let data = [conn.user.jid.split('@')[0], ...global.mods, ...ow.rowner.map(v => v[0]), ...ow.owner.map(v => v[0])].map(v => v + '@s.whatsapp.net')
	if (data.includes(user) && !/cek/.test(command)) return m.reply(isOwner ? 'Owner kebal dari peringatan.' : '🥴 Tidak boleh memberikan peringatan ke owner.')

	let split = user.split('@')[0]
	if (!warn[user]) warn[user] = {
		count: 0,
		alasan: remM(text || '')
	}
	let usr = db.data.chats[m.chat].warn[user]

	let jumlah = 1
	if (!/cek/.test(command)) {
		if (!isAdmin) return m.reply(`*「ADMIN GROUP ONLY」*`)
		let matchAngka = text?.trim().match(/(?:\s|^)(\d+)(?:\s|$)/)
		jumlah = matchAngka ? parseInt(matchAngka[1]) : 1


		if (/del|un/.test(command)) {
			if (usr.count > 0) usr.count = Math.max(usr.count - jumlah, 0)
		} else {
			if (usr.count < 3) usr.count = Math.min(usr.count + jumlah, 3)
			usr.alasan = remM(text.replace(/\d+/, '').trim() || '')
		}
	}

	let par = participants.find(v => v.id == user)
	let isTargetAdmin = par?.admin || false

	let txtPrefix = ''
	if (!/cek/.test(command)) {
		if (/del|un/.test(command)) {
			txtPrefix = `*Warn berkurang -${jumlah}*`
		} else if (isTargetAdmin) {
			txtPrefix = '*Bisa-bisanya admin kena warn* 🥴'
		} else {
			txtPrefix = `*Warn bertambah +${jumlah}*`
		}
	}

	let txt = `${txtPrefix ? txtPrefix + '\n\n' : ''}*User:* @${split}\n*Warn:* (${usr.count}/3)${usr.alasan ? `\n*Alasan:* ${usr.alasan}` : ''}${usr.count >= 3 ? `\n\n⛔ User mencapai batas peringatan, ${isBotAdmin ? `akan segera dikeluarkan.` : `bot bukan admin, tidak bisa mengeluarkan.`}` : ''}`

	await conn.sendMsg(m.chat, { text: txt, mentions: conn.parseMention(txt) }, { quoted: m })

	if (isBotAdmin && usr.count >= 3) {
		delete db.data.chats[m.chat].warn[user]
		await delay(3500)
		try {
			await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
			await conn.reply(m.chat, `@${m.sender.split`@`[0]} telah mengeluarkan @${split} dari grup.`, m, { mentions: [m.sender, user] })
		} catch (e) {
			console.error('Kick failed:', e)
			m.reply('Gagal kick')
		}
	}
}

handler.menugroup = ['warn', 'cekwarn', 'unwarn', 'listwarn']
handler.tagsgroup = ['group']
handler.command = /^((cek|del|un)?warn|listwarn)$/i

handler.help = ['warn', 'cekwarn', 'unwarn', 'listwarn'];
handler.tags = ['Menu Group'];

handler.group = true

export default handler
