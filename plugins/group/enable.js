import db from '../../lib/database.js'
import pkg from 'baileys';
const { WA_DEFAULT_EPHEMERAL, groupToggleEphemeral } = pkg;

let handler = async (m, { conn, usedPrefix, command, args, isOwner, isBotAdmin, isAdmin, isROwner }) => {
	let isEnable = /true|enable|(turn)?on|1/i.test(command)
	let chat = db.data.chats[m.chat]
	let user = db.data.users[m.sender]
	let datas = db.data.datas
	let bot = db.data.settings[conn.user.jid] || {}
	let type = (args[0] || '').toLowerCase()
	let isAll = false, isUser = false
	switch (type) {
		case 'welcome':
			if (!m.isGroup) {
				global.dfail('group', m, conn)
				throw false
			} else if (!isAdmin) {
				global.dfail('admin', m, conn)
				throw false
			}
			chat.welcome = isEnable
			break
		case 'delete':
			if (!m.isGroup) {
				global.dfail('group', m, conn)
				throw false
			} else if (!isAdmin) {
				global.dfail('admin', m, conn)
				throw false
			} else if (!isBotAdmin) {
				global.dfail('botAdmin', m, conn)
				throw false
			}
			chat.delete = isEnable
			break
		case 'game':
			if (!m.isGroup) {
				global.dfail('group', m, conn)
				throw false
			} else if (!isAdmin) {
				global.dfail('admin', m, conn)
				throw false
			} else if (!isBotAdmin) {
				global.dfail('botAdmin', m, conn)
				throw false
			}
			chat.game = isEnable
			break
		case 'antitoxic':
			if (!m.isGroup) {
				global.dfail('group', m, conn)
				throw false
			} else if (!isAdmin) {
				global.dfail('admin', m, conn)
				throw false
			} else if (!isBotAdmin) {
				global.dfail('botAdmin', m, conn)
				throw false
			}
			chat.antiToxic = isEnable
			break
		case 'antidelete':
			if (!m.isGroup) {
				global.dfail('group', m, conn)
				throw false
			} else if (!isAdmin) {
				global.dfail('admin', m, conn)
				throw false
			}
			chat.delete = !isEnable
			break
		case 'presence':
			if (!m.isGroup) {
				global.dfail('group', m, conn)
				throw false
			} else if (!isAdmin) {
				global.dfail('admin', m, conn)
				throw false
			} else if (!isBotAdmin) {
				global.dfail('botAdmin', m, conn)
				throw false
			}
			chat.presence = isEnable
			break
		case 'antilink':
			if (!m.isGroup) {
				global.dfail('group', m, conn)
				throw false
			} else if (!isAdmin) {
				global.dfail('admin', m, conn)
				throw false
			} else if (!isBotAdmin) {
				global.dfail('botAdmin', m, conn)
				throw false
			}
			chat.antiLink = isEnable
			break
		case 'antivirus':
		case 'antivirtex':
		case 'antivirtext':
			if (!m.isGroup) {
				global.dfail('group', m, conn)
				throw false
			} else if (!isAdmin) {
				global.dfail('admin', m, conn)
				throw false
			} else if (!isBotAdmin) {
				global.dfail('botAdmin', m, conn)
				throw false
			}
			chat.antivirus = isEnable
			break
		case 'antiviewonce':
			if (!m.isGroup) {
				global.dfail('group', m, conn)
				throw false
			} else if (!isAdmin) {
				global.dfail('admin', m, conn)
				throw false
			}
			chat.viewonce = isEnable
			break
		
		case 'anticall':
		case 'autoreject':
		case 'autorejectcall':
			isAll = true
			if (!isROwner) {
				global.dfail('rowner', m, conn)
				throw false
			}
			datas.anticall = isEnable
			break
		case 'ep':
		case 'ephem':
		case 'ephemeral':
		case 'psgc':
			if ((isAdmin || isOwner) && isBotAdmin) {
				if (isEnable) {
					conn.groupToggleEphemeral(m.chat, WA_DEFAULT_EPHEMERAL)
				} else {
					conn.groupToggleEphemeral(m.chat, 0)
				}
			} else {
				m.reply(isBotAdmin ? `*「ADMIN GROUP ONLY」*` : `*「BOT HARUS JADI ADMIN」*`)
			}
			break
		default:
			if (!/[01]/.test(command)) return m.reply(`*List option :*\n| presence | welcome | delete | antidelete | ephemeral | anticall | game | antilink | antitoxic | antivirtex | antiviewonce |

Example :
*${usedPrefix + command} welcome*
*${usedPrefix + command} welcome*
`.trim())
			throw false
	}
	await conn.reply(m.chat, `*${type}* berhasil di *${isEnable ? 'nyala' : 'mati'}kan* ${isAll ? 'untuk bot ini' : isUser ? '' : 'untuk chat ini'}`, m)
}

handler.menugroup = ['en', 'dis'].map(v => v + 'able <option>')
handler.tagsgroup = ['group']
handler.command = /^((en|dis)able|(tru|fals)e|(turn)?o(n|ff)|[01])$/i

handler.help = ['en', 'dis'].map(v => v + 'able <option>')
handler.tags = ['Menu Group'];

export default handler