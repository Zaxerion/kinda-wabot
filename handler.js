import chalk from 'chalk'
import db, { loadDatabase } from './lib/database.js'
import Connection from './lib/connection.js'
import fs, { unwatchFile, watchFile } from 'fs'
import Helper from './lib/helper.js'
import path, { join } from 'path'
import printMessage from './lib/print.js'
import { fileURLToPath } from 'url'
import { format } from 'util'
import { plugins } from './lib/plugins.js'
import { smsg } from './lib/simple.js'
import { ranNumb, padLead } from './lib/func.js'
import knights from '@zaxerion/k-canvas';
import { getContentType } from 'baileys'

const isNumber = x => typeof x === 'number' && !isNaN(x)

export async function handler(chatUpdate) {
	if (!chatUpdate)
		return
	let m = chatUpdate.messages[chatUpdate.messages.length - 1]
	if (!m)
		return

	const now = Date.now()
	const messageTimestamp = (m.messageTimestamp || m.message?.messageTimestamp || 0) * 1000
	if (messageTimestamp && now - messageTimestamp > 5 * 60_000) return

	if (db.data == null)
		await loadDatabase()
	try {
		m = smsg(this, m) || m
		if (!m) return

		m.exp = 0
		m.limit = false
		try {
			// TODO: use loop to insert data instead of this
			let user = db.data.users[m.sender]
			if (m.sender.endsWith('@s.whatsapp.net') || m.sender.endsWith('@lid')) {
				if (typeof user !== 'object')
					db.data.users[m.sender] = {}
				if (user) {
					if (!isNumber(user.cooldown))
						user.cooldown = 0
					if (!('banned' in user))
						user.banned = false
					if (!('permaban' in user))
						user.permaban = false
					if (!isNumber(user.lastbanned))
						user.lastbanned = 0
					if (!isNumber(user.bannedcd))
						user.bannedcd = 0
					if (!isNumber(user.warn))
						user.warn = 0
					if (!isNumber(user.spamcount))
						user.spamcount = 0
					if (!isNumber(user.warning))
						user.warning = 0

				} else db.data.users[m.sender] = {
					cooldown: 0,
					banned: false,
					permaban: false,
					lastbanned: 0,
					bannedcd: 0,
					warn: 0,
					spamcount: 0,
					warning: 0,
				}
			}
			let chat = db.data.chats[m.chat]
			if (m.chat.endsWith('@g.us')) {
				if (typeof chat !== 'object')
					db.data.chats[m.chat] = {}
				if (chat) {
					if (!('isBanned' in chat)) chat.isBanned = false
					if (!('permaBan' in chat)) chat.permaBan = false
					if (!('welcome' in chat)) chat.welcome = true
					if (!('detect' in chat)) chat.detect = false
					if (!('sWelcome' in chat)) chat.sWelcome = ''
					if (!('sBye' in chat)) chat.sBye = ''
					if (!('sPromote' in chat)) chat.sPromote = ''
					if (!('sDemote' in chat)) chat.sDemote = ''
					if (!('delete' in chat)) chat.delete = true
					if (!('antiLink' in chat)) chat.antiLink = false
					if (!('antiSticker' in chat)) chat.antiSticker = false
					if (!('antiToxic' in chat)) chat.antiToxic = false
					if (!('antiLinkKick' in chat)) chat.antiLinkKick = false
					if (!('adminonly' in chat)) chat.adminonly = false
					if (!('antivirus' in chat)) chat.antivirus = false
					if (!('antitagsw' in chat)) chat.antitagsw = false
					if (!('viewonce' in chat)) chat.viewonce = false
					if (!isNumber(chat.lastmute)) chat.lastmute = 0
					if (!isNumber(chat.mutecd)) chat.mutecd = 0
					if (!isNumber(chat.spamcount)) chat.spamcount = 0
					if (!('warn' in chat)) chat.warn = {}
				} else db.data.chats[m.chat] = {
					isBanned: false,
					permaBan: false,
					welcome: true,
					detect: false,
					sWelcome: '',
					sBye: '',
					sPromote: '',
					sDemote: '',
					openaitxt: [],
					delete: true,
					antiLink: false,
					antiSticker: false,
					antiToxic: false,
					antiLinkKick: false,
					adminonly: false,
					antivirus: false,
					antitagsw: false,
					viewonce: false,
					lastmute: 0,
					mutecd: 0,
					spamcount: 0,
					warn: {},
				}
			}
			let settings = db.data.settings[this.user.jid]
			if (typeof settings !== 'object') db.data.settings[this.user.jid] = {}
			if (settings) {
				if (!('self' in settings)) settings.self = false
				if (!('restrict' in settings)) settings.restrict = false
			} else db.data.settings[this.user.jid] = {
				self: false,
				restrict: false
			}
			let datas = db.data.datas
			if (typeof datas !== 'object') db.data.datas = {}
			if (datas) {
				if (!('maingroupname' in datas)) datas.maingroupname = ''
				if (!('packname' in datas)) datas.packname = ''
				if (!('author' in datas)) datas.author = ''
				if (!('linkgc' in datas)) datas.linkgc = 'https://chat.whatsapp.com/Fx62AohmN9iAijz4ZtmzwA'
				if (!('anticall' in datas)) datas.anticall = false
				if (!('rowner' in datas)) datas.rowner = []
				if (!('owner' in datas)) datas.owner = []
				if (!('rvo' in datas)) datas.rvo = []
			} else db.data.datas = {
				maingroupname: '',
				packname: '',
				author: '',
				linkgc: 'https://chat.whatsapp.com/Fx62AohmN9iAijz4ZtmzwA',
				anticall: false,
				rowner: [['6285157571221', 'Zaxerion', true]],
				owner: [],
				rvo: [],
			}

			if (!db.data.lid) db.data.lid = {}
			let candidates = [m.key?.participantPn, m.key?.participantAlt, m.key?.participant, m.key?.remoteJidAlt, m.key?.remoteJid, m.sender, m.key?.senderPn, m.key?.senderLid].filter(Boolean)

			let id = candidates.find(jid => jid.endsWith('@lid'))
			let wa = candidates.find(jid => jid.endsWith('@s.whatsapp.net'))

			if (!wa && m.chat.endsWith('@g.us')) {
				const groupMetadata = await Connection.store.fetchGroupMetadata(m.chat, this.groupMetadata)
				const participants = groupMetadata.participants
				const user = participants.find(p => p.id === id || p.lid === id)
				if (user?.phoneNumber) {
					wa = user.phoneNumber?.endsWith('@s.whatsapp.net') ? user.phoneNumber : (user.id?.endsWith('@s.whatsapp.net') ? user.id : '')
				}
			}

			let lid = db.data.lid[id]
			if (id && id.endsWith('@lid')) {
				if (lid) {
					if (!('number' in lid)) lid.number = wa || ''
				} else db.data.lid[id] = {
					number: wa || '',
				}
			}
		} catch (e) {
			console.error(e)
		}

		const isMods = global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
		const isROwner = isMods || m.fromMe || [this.decodeJid(this.user.id), ...db.data.datas.rowner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
		const isOwner = isROwner || m.fromMe || db.data.datas.owner.map(([number]) => number).map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)

		const cooldownTime = (isOwner) ? 0 : 20000

		if (opts['nyimak'])
			return
		if (typeof m.text !== 'string')
			m.text = ''

		if (!m.chat) return
		m.exp += Math.ceil(Math.random() * 10)

		let usedPrefix
		const groupMetadata = (m.isGroup ? await Connection.store.fetchGroupMetadata(m.chat, this.groupMetadata) : {}) || {}
		const participants = m.isGroup ? (groupMetadata.participants || []) : []
		const user = participants.find(p => p.phoneNumber === m.sender || p.id === m.sender || p.lid === m.sender) || {}
		const bot = participants.find(p => p.id === this.user.jid || p.id === this.decodeJid(this.user.lid)) || {}

		const isRAdmin = user?.admin === 'superadmin' || false
		const isAdmin = isRAdmin || user?.admin === 'admin' || false
		const isBotAdmin = bot?.admin || false 
		const isAdminOwner = isAdmin || isOwner

		const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
		for (let name in plugins) {
			let plugin = plugins[name]
			if (!plugin)
				continue
			if (plugin.disabled)
				continue
			const __filename = join(___dirname, name)
			if (typeof plugin.all === 'function') {
				try {
					await plugin.all.call(this, m, {
						chatUpdate,
						__dirname: ___dirname,
						__filename
					})
				} catch (e) {
					console.error(e)
					if (db.data.datas.rowner.length > 0) {
						for (let [jid] of db.data.datas.rowner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
							let data = (await this.onWhatsApp(jid))[0] || {}
							if (data.exists)
								m.reply(`*Plugin:* ${name}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${m.text}\n\n\`\`\`${format(e)}\`\`\``.trim(), data.jid)
						}
					}
				}
			}
			if (!opts['restrict'])
				if (plugin.tags && plugin.tags.includes('admin')) {
					// global.dfail('restrict', m, this)
					continue
				}
			const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
			let _prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : global.prefix
			let match = (_prefix instanceof RegExp ? 
				[[_prefix.exec(m.text), _prefix]] :
				Array.isArray(_prefix) ? 
					_prefix.map(p => {
						let re = p instanceof RegExp ? 
							p :
							new RegExp(str2Regex(p))
						return [re.exec(m.text), re]
					}) :
					typeof _prefix === 'string' ? 
						[[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
						[[[], new RegExp]]
			).find(p => p[1])
			if (typeof plugin.before === 'function') {
				if (await plugin.before.call(this, m, {
					match,
					conn: this,
					participants,
					groupMetadata,
					user,
					bot,
					isROwner,
					isOwner,
					isRAdmin,
					isAdmin,
					isBotAdmin,
					chatUpdate,
					__dirname: ___dirname,
					__filename
				}))
					continue
			}
			if (typeof plugin !== 'function')
				continue
			if ((usedPrefix = (match[0] || '')[0])) {
				let noPrefix = m.text.replace(usedPrefix, '')
				let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
				args = args || []
				let _args = noPrefix.trim().split` `.slice(1)
				let text = _args.join` `
				command = (command || '').toLowerCase()
				let fail = plugin.fail || global.dfail
				let isAccept = plugin.command instanceof RegExp ?
					plugin.command.test(command) :
					Array.isArray(plugin.command) ?
						plugin.command.some(cmd => cmd instanceof RegExp ? 
							cmd.test(command) :
							cmd === command
						) :
						typeof plugin.command === 'string' ?
							plugin.command === command :
							false

				if (!isAccept)
					continue
				m.plugin = name

				if (m.chat in db.data.chats || m.sender in db.data.users) {
					let chat = db.data.chats[m.chat]
					let user = db.data.users[m.sender]
					let anti = /_/.test(m.plugin)
					if (m.chat.endsWith('@g.us')) {
						if (!chat.mute) chat.mute = []

						let mutedUser = chat.mute?.find(v => v.user == m.sender)
						if (mutedUser?.silent) {
							return
						}
					}
					if (chat?.isBanned && !isAdmin && m.sender != bot?.id)
						return
					if (chat?.permaBan && m.sender != bot?.id)
						return
					if (user?.banned)
						return
					if (!isROwner && opts['self'] && !anti)
						return
					if (opts['pconly'] && m.chat.endsWith('g.us') && !anti)
						return
				}
				if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { 
					fail('owner', m, this)
					continue
				}
				if (plugin.rowner && !isROwner) { 
					fail('rowner', m, this)
					continue
				}
				if (plugin.owner && !isOwner) { 
					fail('owner', m, this)
					continue
				}
				if (plugin.mods && !isMods) { 
					fail('mods', m, this)
					continue
				}
				if (plugin.group && !m.isGroup) {
					fail('group', m, this)
					continue
				} else if (plugin.botAdmin && !isBotAdmin) { 
					fail('botAdmin', m, this)
					continue
				} else if (plugin.admin && !isAdmin) { 
					fail('admin', m, this)
					continue
				}
				if (plugin.private && m.isGroup) { 
					fail('private', m, this)
					continue
				}

				let now = Date.now();
				let userCooldown = db.data.users[m.sender]?.cooldown || 0;

				if ((usedPrefix = (match[0] || '')[0])) {
					if (now < userCooldown) {
						return;
					}
					db.data.users[m.sender].cooldown = now + cooldownTime;
				}

				m.isCommand = true
				let extra = {
					match,
					usedPrefix,
					noPrefix,
					_args,
					args,
					command,
					text,
					conn: this,
					participants,
					groupMetadata,
					user,
					bot,
					isMods,
					isROwner,
					isOwner,
					isRAdmin,
					isAdmin,
					isBotAdmin,
					chatUpdate,
					__dirname: ___dirname,
					__filename
				}
				try {
					await plugin.call(this, m, extra)
				} catch (e) {
					m.error = e
					console.error(e)
					if (e) {
						let text = format(e)
						text = text.replace(/\n\s+at/g, "\n- at");
						for (let key of Object.values(global.APIKeys)) {
							if (!key) continue;
							text = text.replace(new RegExp(escapeRegex(key), "g"), "#HIDDEN#");
						}
						if (e.name)
							if (db.data.datas.rowner.length > 0) {
								for (let [jid] of db.data.datas.rowner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
									let data = (await this.onWhatsApp(jid))[0] || {}
									if (data.exists)
										m.reply(`*Plugin:* ${m.plugin}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${usedPrefix}${command} ${args.join(' ')}\n\n\`\`\`${text}\`\`\``.trim(), data.jid)
								}
							}
						m.reply(text)
					}
				} finally {
					if (typeof plugin.after === 'function') {
						try {
							await plugin.after.call(this, m, extra)
						} catch (e) {
							console.error(e)
						}
					}
				}
				break
			}
		}

		try {
			if (!opts['noprint']) await printMessage(m, this)
		} catch (e) {
			console.log(m, m.quoted, e)
		}
		
	} catch (e) {
		console.error(e)
	}
	global.wish = wish()
}

export async function participantsUpdate({ id, participants, action, simulate = false }) {
	if (opts['self']) return
	if (this.isInit) return
	if (db.data == null) await loadDatabase()
	let chat = db.data.chats[id] || {}
	let text = ''
	const meta = await Connection.store.fetchGroupMetadata(id, this.groupMetadata) || await this.groupMetadata(id)
	let bg = `https://raw.githubusercontent.com/dayoyui/dbs/main/media/picbot/menus/menus_${padLead(ranNumb(43), 3)}.jpg`
	let setw = chat.sWelcome ? '' : '\n\nGunakan .setwelcome untuk mengedit teks welcome'
	let setl = chat.sBye ? '' : '\n\nGunakan .setbye untuk mengedit teks leave'
	let namegc = await this.getName(id)
	let ava_cont = 'https://raw.githubusercontent.com/dayoyui/dbs/main/media/avatar_contact.jpg'

	switch (action) {
		case 'add': {
			if (chat.welcome) {
				for (let user of participants) {
					user = await this.getJid(user)
					let name = await this.getName(user)
					let pp = ava_cont
					let txt = (chat.sWelcome || this.welcome || Connection.conn.welcome || 'Welcome, @user!').replace('@user', '@' + user.split('@')[0]).replace('@subject', namegc).replace('@desc', (meta.desc?.toString() || '~')) + setw

					const image = await new knights.Welcome2()
						.setAvatar(pp)
						.setUsername(name)
						.setBg(bg)
						.setGroupname(namegc)
						.setMember(meta.participants.length)
						.toAttachment();

					const data = image.toBuffer();

					await this.sendFile(id, data, '', txt, false, false, { mentions: [user] })
				}
			}
			break
		}
		case 'remove': {
			if (chat.welcome) {
				for (let user of participants) {
					user = await this.getJid(user)
					let name = await this.getName(user)
					let pp = ava_cont
					let txt = ((chat.sBye || this.bye || Connection.conn.bye || 'Bye, @user!') + setl).replace('@user', '@' + user.split('@')[0])
					const image = await new knights.Goodbye2()
						.setAvatar(pp)
						.setUsername(name)
						.setBg(bg)
						.setMember(meta.participants.length)
						.toAttachment();

					const data = image.toBuffer();
					await this.sendFile(id, data, '', txt, false, false, { mentions: [user] })
				}
			}
			break
		}
		case 'promote': {
			text = (chat.sPromote || this.sPromote || Connection.conn.sPromote || '@user ```is now admin```').replace('@user', '@' + participants[0].split('@')[0])
			await this.sendMsg(id, { text, mentions: this.parseMention(text), contextInfo: { externalAdReply: { title: 'kinda.icu', body: 'Powered by ' + ('zaxerion'), thumbnailUrl: `https://kinda.icu/redir/${global.imageId}`, thumbnail: global.thumbnail } } })
			break
		}
		case 'demote': {
			text = (chat.sDemote || this.sDemote || Connection.conn.sDemote || '@user ```is no longer admin```').replace('@user', '@' + participants[0].split('@')[0])
			await this.sendMsg(id, { text, mentions: this.parseMention(text), contextInfo: { externalAdReply: { title: 'kinda.icu', body: 'Powered by ' + ('zaxerion'), thumbnailUrl: `https://kinda.icu/redir/${global.imageId}`, thumbnail: global.thumbnail } } })
			break
		}
	}
}

export async function groupsUpdate(groupsUpdate) {
	if (opts['self'])
		return
	for (const groupUpdate of groupsUpdate) {
		const id = groupUpdate.id
		if (!id) continue

		let chats = db.data.chats[id], text = ''
		if (!chats?.detect) continue
		if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || Connection.conn.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc)
		if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || Connection.conn.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject)
		if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || Connection.conn.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon)
		if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || Connection.conn.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke)
		if (!text) continue
		await this.sendMsg(id, { text, mentions: this.parseMention(text) })
	}
}

export async function deleteUpdate(message) {

	if (Array.isArray(message.keys) && message.keys.length > 0) {
		const tasks = await Promise.allSettled(message.keys.map(async (key) => {
			if (key.fromMe) return
			const msg = this.loadMessage(key.remoteJid, key.id) || this.loadMessage(key.id)
			if (!msg || !msg.message) return
			let chat = db.data.chats[key.remoteJid]
			if (!chat || chat.delete) return

			const mtype = getContentType(msg.message)
			if (mtype === 'conversation') {
				msg.message.extendedTextMessage = { text: msg.message[mtype] }
				delete msg.message[mtype]
			}

			const participant = msg.participant || msg.key.participant || msg.key.remoteJid
			await this.reply(key.remoteJid, `@${participant.split`@`[0]} telah menghapus pesan\n*.off antidelete* untuk menonaktifkan`, msg, { mentions: [participant] })
			return await this.copyNForward(key.remoteJid, msg).catch(e => console.log(e, msg))
		}))
		tasks.map(t => t.status === 'rejected' && console.error(t.reason))
	}
}


global.dfail = (type, m, conn) => {
	let msg = {
		rowner: `*「OWNERR BOT ONLY」*`,
		owner: `*「OWNER BOT ONLY」*`,
		mods: `*「DEV / MODS ONLY」*`,
		group: `*「GROUP ONLY」*`,
		private: `*「PRIVATE CHAT ONLY」*`,
		admin: `*「ADMIN GROUP ONLY」*`,
		game: '```「 aktifkan mode game melalui .enable game! 」```',
		botAdmin: `*「BOT HARUS JADI ADMIN」*`,
		unreg: 'Silahkan daftar untuk menggunakan fitur ini dengan cara mengetik:\n\n*#daftar nama.umur*\n\nContoh: *#daftar Manusia.16*',
		restrict: 'Fitur ini di *disable*!'
	}[type]
	if (msg) return m.reply(msg)
}

let file = Helper.__filename(import.meta.url, true)
watchFile(file, async () => {
	unwatchFile(file)
	console.log(chalk.redBright("Update 'handler.js'"))
	if (Connection.reload) console.log(await Connection.reload(await Connection.conn))
})

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wish() {
	let time = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
	let hours = time.getHours();
	let minutes = time.getMinutes();
	let quarter = Math.floor(minutes / 15);
	const messages = {
		0: [
			"🍩 Udah tengah malam, bobo yuk~",
			"🧁 Jangan begadang, sayangin badanmu~",
			"🍓 Malem sunyi, enaknya tidur~",
		],
		1: [
			"🍡 Udah jam 1, waktunya bobo~",
			"🍧 Mata udah berat, ayo tidur~",
			"🍮 Mimpi indah yaa~",
		],
		2: [
			"🍫 Jam 2 pagi? Jangan lupa istirahat~",
			"🍩 Udah larut, bobo yuk~",
			"🍒 Nyaman tidur jam segini~",
		],
		3: [
			"🍓 Jam 3, waktunya bobo cantik~",
			"🧁 Istirahat biar segar besok~",
			"🍡 Tidur nyenyak enak banget~",
		],
		4: [
			"🌸 Subuh adem, semangat bangun~",
			"🍵 Waktunya teh hangat~",
			"🍓 Pagi cerah, ayo olahraga~",
		],
		5: ["🐓 Ayam berkokok, bangun yuk~", "🍞 Sarapan biar kuat~", "🍯 Selamat pagi manis~"],
		6: ["🍎 Olahraga pagi dulu yuk~", "🍫 Semangat kerja/kelas~", "☀️ Pagi cerah bikin happy~"],
		7: ["☕ Ngopi dulu biar melek~", "🍪 Yuk fokus kerjaan~", "🍩 Pagi produktif yaa~"],
		8: ["🍒 Cemilan pagi biar kuat~", "🥤 Jangan lupa minum ya~", "🍱 Siang sebentar lagi~"],
		9: [
			"🍚 Selamat siang, makan yuk~",
			"🍛 Lagi makan apa nih~",
			"🍮 Habis makan santai bentar~",
		],
		10: [
			"🍵 Siang panas, minum ya~",
			"🍫 Jangan lupa fokus lagi~",
			"🍧 Es teh siang enak bgt~",
		],
		11: [
			"🍩 Sore mendekat, cepet selesain kerja~",
			"🍪 Ngemil sore seru~",
			"🌸 Langit cantik bgt~",
		],
		12: [
			"🍚 Udah jam 12, makan siang yuk~",
			"🍲 Jangan skip makan siang~",
			"🍵 Istirahat bentar habis makan~",
		],
		13: ["🍧 Siang panas, minum yang segar~", "🍹 Jangan lupa hidrasi~", "🍉 Siang terik nih~"],
		14: ["🍫 Siang enaknya ngemil~", "🥤 Waktunya minum segar~", "📖 Santai bentar yuk~"],
		15: [
			"🍪 Udah sore, stretching dikit~",
			"🍩 Ngemil cookies enak nih~",
			"🌇 Langit sore cakep bgt~",
		],
		16: [
			"🍵 Teh sore + camilan perfect~",
			"🍰 Santai sambil nonton~",
			"📸 Foto langit sore yuk~",
		],
		17: [
			"🍽️ Udah sore, siap2 makan malam~",
			"🍲 Mau makan apa malam ini?~",
			"🌅 Sore adem banget~",
		],
		18: ["🍛 Jangan lupa makan malam~", "🍫 Malam tenang banget~", "📺 Nonton santai yuk~"],
		19: ["🎶 Malam asik sambil musik~", "📱 Sosmed-an bentar~", "🎮 Main game santai~"],
		20: ["🍵 Skincare + relax time~", "📖 Baca buku sebelum tidur~", "🛌 Jam 8, siap tidur~"],
		21: ["🍒 Jangan begadang, bobo yuk~", "🧁 Tidur awal biar fresh~", "🌙 Malem nyenyak yaa~"],
		22: ["🍩 Jangan lupa matiin lampu~", "✨ Mimpi indah ya~", "🛌 Tidur cukup itu penting~"],
		23: [
			"💤 Udah tengah malam, bobo nyenyak~",
			"🍓 Jangan begadang terus~",
			"🍮 Selamat malam, mimpi manis~",
		],
	};
	let message = messages[hours]?.[quarter] || messages[hours]?.[3] || "✨ Waktu berjalan terus~";
	return `${message}`;
}