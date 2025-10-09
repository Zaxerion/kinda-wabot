import path from 'path'
import { toAudio } from './converter.js'
import { parsePhoneNumber } from 'awesome-phonenumber'
import fs from 'fs'
import got from 'got'
import util from 'util'
import { fileURLToPath } from 'url'
import Connection from './connection.js'
import Helper from './helper.js'
import { mime, stream2buffer } from './func.js'
import { fileTypeFromBuffer } from 'file-type'
import db from './database.js'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

import {
	areJidsSameUser,
	downloadContentFromMessage,
	extractMessageContent,
	generateForwardMessageContent,
	generateWAMessage,
	generateWAMessageFromContent,
	getContentType,
	jidDecode,
	prepareWAMessageMedia,
	proto,
	toReadable
} from 'baileys'

export function HelperConnection(conn, { store, logger }) {
	const botUser = conn.user || {}

	let sock = Object.defineProperties(conn, {
		decodeJid: {
			value(jid) {
				if (!jid || typeof jid !== 'string') return (!nullish(jid) && jid) || null

				return jid?.decodeJid?.()
			}
		},
		getJid: {
			value(sender) {
				if (!sender.endsWith('@lid')) return sender.decodeJid?.() || sender;
				const match = db.data.lid?.[sender]
				if (match?.number) {
					return match.number
				}
				return sender.decodeJid?.() || sender
			}
		},
		logger: {
			value: {
				...logger,
				info: logger.info?.bind(logger),
				error: logger.error?.bind(logger),
				warn: logger.warn?.bind(logger),
				fatal: logger.fatal?.bind(logger),
				debug: logger.debug?.bind(logger),
				trace: logger.trace?.bind(logger)
			},
			enumerable: true,
			writable: true
		},
		getFile: {
			async value(PATH, saveToFile = false) {
				let filename, type, fullpath, data
				if (Buffer.isBuffer(PATH)) data = PATH
				else if (PATH instanceof ArrayBuffer) data = PATH.toBuffer()
				else if (Helper.isReadableStream(PATH)) data = await stream2buffer(PATH)
				else if (/^data:.*?\/.*?;base64,/i.test(PATH)) data = Buffer.from(PATH.split`,`[1], 'base64')
				else if (fs.existsSync(PATH)) data = fs.readFileSync(PATH)
				else if (/^https?:\/\//.test(PATH)) {
					data = await got(PATH, { responseType: 'buffer', throwHttpErrors: false })
					if (data.headers['content-disposition']) {
						try {
							filename = decodeURIComponent(data.headers['content-disposition'].split(';').find(n => n.includes('filename=')).replace(/filename=|"/g, '').trim())
						} catch { }
					}
					data = data.body ?? data.rawBody
				} else data = Buffer.alloc(0)

				try {
					fs.statSync(PATH).isFile()
					filename = path.basename(PATH)
					fullpath = path.resolve(PATH)
				} catch { }

				if (Buffer.byteLength(data) > 2000000000) throw new TypeError('Canceled process... WhatsApp 2GB File Sharing Limit exceeds')
				let mimetype = (filename || '').split('.').pop()
				type = mime[mimetype] ? { mime: mime[mimetype], ext: mimetype }
					: (await fileTypeFromBuffer(data) || { mime: 'application/octet-stream', ext: 'bin' })
				if (saveToFile) {
					filename = `${Date.now()}.${type.ext}`
					fullpath = path.join(__dirname, `../tmp/${filename}`)
					fs.writeFileSync(fullpath, data)
				}
				return {
					filename,
					fullpath,
					...type,
					data,
					async clear() {
						data.fill(0)
					}
				}
			},
			enumerable: true,
			writable: true,
		},
		sendMsg: {
			async value(jid, message = {}, options = {}) {
				if (!message.react) {
					await sendPresence('composing', conn, jid)
				}

				const res = await conn.sendMessage(
					jid,
					message,
					{ ...options, backgroundColor: '', ephemeralExpiration: 86400 }
				)

				if (!message.react) {
					await sendPresence('paused', conn, jid)
				}

				return res
			},
			enumerable: true,
			writable: true
		},
		sendPoll: {
			async value(jid, name = '', values = [], selectableCount = 1) {
				await sendPresence('composing', conn, jid)
				const res = await conn.sendMessage(jid, { poll: { name, values, selectableCount } })
				await sendPresence('paused', conn, jid)
				return res
			},
			enumerable: true,
			writable: true
		},
		sendFThumb: {
			async value(jid, title, body, text = '', thumbnail, thumbnailUrl, quoted, LargerThumbnail = true) {
				const res = conn.relayMessage(jid, {
					extendedTextMessage: {
						text: text,
						contextInfo: {
							mentionedJid: await conn.parseMention(text),
							externalAdReply: {
								title: title,
								body: body,
								mediaType: 1,
								//previewType: 0,
								renderLargerThumbnail: LargerThumbnail,
								thumbnail: thumbnail,
								thumbnailUrl: thumbnailUrl,
							},
						},
					}
				}, { quoted })
				await sendPresence('paused', conn, jid)
				return res
			},
			enumerable: true,
			writable: true,
		},
		sendFAudio: {
			async value(jid, audioinfo = {}, m, title, thumbnailUrl, sourceUrl, body = '', LargerThumbnail = true) {
				const response = await fetch(thumbnailUrl);
				const arrayBuffer = await response.arrayBuffer();
				const thumbnail = Buffer.from(arrayBuffer);

				await sendPresence('recording', conn, jid)
				const res = await conn.sendMessage(jid, {
					...audioinfo,
					contextInfo: {
						externalAdReply: {
							title: title,
							body: body,
							thumbnail: thumbnail,
							thumbnailUrl: sourceUrl,
							sourceUrl: sourceUrl,
							mediaType: 1,
							//renderLargerThumbnail: LargerThumbnail
						}
					}
				}, { quoted: m })
				await sendPresence('paused', conn, jid)
				return res
			},
			enumerable: true,
			writable: true,
		},
		sendFile: {
			async value(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}, isConvert = false) {
				const file = await conn.getFile(path)
				let mtype = '',
					buffer = file.data,
					mimetype = options.mimetype || file.mime,
					convert
				const opt = {}

				if (quoted) opt.quoted = quoted
				if (!file.ext === '.bin') options.asDocument = true

				if (/webp/.test(mimetype) || (/image/.test(mimetype) && options.asSticker)) mtype = 'sticker'
				else if (/image/.test(mimetype) || (/webp/.test(mimetype) && options.asImage)) mtype = 'image'
				else if (/video/.test(mimetype)) mtype = 'video'
				else if (/audio/.test(mimetype)) {
					mtype = 'audio'
					mimetype = options.mimetype || file.mime || 'audio/mpeg'
					if (isConvert || /wav/.test(mimetype)) {
						convert = await toAudio(buffer, file.ext)
						buffer = await convert.toBuffer()
						mimetype = 'audio/ogg; codecs=opus'
					}
				}
				else mtype = 'document'
				if (options.asDocument) mtype = 'document'
				if (Buffer.byteLength(buffer) > 70000000) mtype = 'document'

				delete options.asSticker
				delete options.asLocation
				delete options.asVideo
				delete options.asDocument
				delete options.asImage

				let message = {
					...options,
					caption,
					ptt,
					[mtype]: buffer,
					mimetype,
					fileName: filename || file.filename || `file.${file.ext}`
				}
				let error = false
				try {
					await sendPresence('composing', conn, jid)
					const res = await conn.sendMsg(jid, message, { ...opt, ...options })
					await sendPresence('paused', conn, jid)
					return res
				} catch (e) {
					console.error(e)
					error = e
				} finally {
					file.clear()
					if (error) throw error
				}
			},
			enumerable: true,
			writable: true,
		},
		sendContact: {
			async value(jid, data, quoted, options = {}) {
				if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data]
				const contacts = []
				for (let [number, name] of data) {
					number = number.replace(/[^0-9]/g, '')
					let njid = number + '@s.whatsapp.net'
					let biz = await conn.getBusinessProfile(njid).catch(_ => null) || {}
					let vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name.replace(/\n/g, '\\n')};;;
FN:${name.replace(/\n/g, '\\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${parsePhoneNumber('+' + number)?.number?.international || ''}${biz.description ? `
X-WA-BIZ-NAME:${(store.getContact(njid)?.vname || conn.getName(njid) || name).replace(/\n/, '\\n')}
X-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}
`.trim() : ''}
END:VCARD
`.trim()
					contacts.push({ vcard, displayName: name })

				}
				return await conn.sendMsg(jid, {
					...options,
					contacts: {
						...options,
						displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
						contacts,
					}
				}, { quoted, ...options })
			},
			enumerable: true,
			writable: true,
		},
		reply: {
			async value(jid, text = '', quoted, options = {}) {
				await sendPresence('composing', conn, jid)
				let res
				if (Buffer.isBuffer(text)) {
					res = await conn.sendFile(jid, text, 'file', '', quoted, false, options)
				} else {
					res = await conn.sendMsg(jid, { ...options, text }, { quoted, ...options })
				}
				await sendPresence('paused', conn, jid)
				return res
			},
			writable: true,
		},
		preSudo: {
			async value(text, who, m, chatupdate) {
				let messages = await generateWAMessage(m.chat, {
					text, contextInfo: {
						mentionedJid: await conn.parseMention(text),
						groupMentions: await conn.parseGroup(text)
					}
				}, {
					userJid: who,
					quoted: m.quoted && m.quoted.fakeObj
				})
				messages.key.fromMe = areJidsSameUser(who, conn.user.id)
				messages.key.id = m.key.id
				messages.pushName = m.name
				if (m.isGroup)
					messages.key.participant = messages.participant = who
				let msg = {
					...chatupdate,
					messages: [proto.WebMessageInfo.create(messages)].map(v => (v.conn = this, v)),
					type: 'append'
				}
				return msg
			}
		},
		cMod: {
			value(jid, message, text = '', sender = conn.user.jid, options = {}) {
				if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
				let copy = message.toJSON()
				delete copy.message.messageContextInfo
				delete copy.message.senderKeyDistributionMessage
				let mtype = Object.keys(copy.message)[0]
				let msg = copy.message
				let content = msg[mtype]
				if (typeof content === 'string') msg[mtype] = text || content
				else if (content.caption) content.caption = text || content.caption
				else if (content.text) content.text = text || content.text
				if (typeof content !== 'string') {
					msg[mtype] = { ...content, ...options }
					msg[mtype].contextInfo = {
						...(content.contextInfo || {}),
						mentionedJid: options.mentions || content.contextInfo?.mentionedJid || [],
						groupMentions: content.contextInfo?.groupMentions || []
					}
				}
				if (copy.participant) sender = copy.participant = sender || copy.participant
				else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
				if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
				else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
				copy.key.remoteJid = jid
				copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
				return proto.WebMessageInfo.create(copy)
			},
			enumerable: true,
			writable: true,
		},
		copyNForward: {
			async value(jid, message, forwardingScore = true, options = {}) {
				let vtype
				if (options.readViewOnce && message.message.viewOnceMessage?.message) {
					vtype = Object.keys(message.message.viewOnceMessage.message)[0]
					delete message.message.viewOnceMessage.message[vtype].viewOnce
					message.message = proto.Message.create(
						JSON.parse(JSON.stringify(message.message.viewOnceMessage.message))
					)
					message.message[vtype].contextInfo = message.message.viewOnceMessage.contextInfo
				}
				let mtype = getContentType(message.message)
				let m = generateForwardMessageContent(message, !!forwardingScore)
				let ctype = getContentType(m)
				if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1) m[ctype].contextInfo.forwardingScore += forwardingScore
				m[ctype].contextInfo = {
					...(message.message[mtype].contextInfo || {}),
					...(m[ctype].contextInfo || {})
				}
				m = generateWAMessageFromContent(jid, m, {
					...options,
					userJid: conn.user.jid
				})
				await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: options })
				return m
			},
			enumerable: true,
			writable: true,
		},
		downloadM: {
			async value(m, type, opts) {
				let fullpath
				if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
				const stream = await downloadContentFromMessage(m, type == 'ptv' ? 'video' : type)

				// Use push to fix performance issue
				let buffers = []
				for await (const chunk of stream) buffers.push(chunk)
				buffers = await Buffer.concat(buffers)
				if (opts.asStream) buffers = await toReadable(buffers)

				// Destroy the stream
				stream.destroy()

				// If saveToFile is true, call getFile function to save file and then get filename
				if (opts.saveToFile) ({ fullpath } = await conn.getFile(buffers, true))
				return opts.saveToFile && fs.existsSync(fullpath) ? fullpath : buffers
			},
			enumerable: true,
			writable: true,
		},
		parseMention: {
			value(text = '') {
				return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
			},
			enumerable: true,
			writable: true,
		},
		parseGroup: {
			async value(text = '') {
				const arr = [], array = text.match(/@[0-9-]+@g\.us/g) || []
				for (let x of array) {
					const g = x.replace('@', '')
					const groupSubject = await conn.getName(g) || 'Unknown'
					arr.push({
						groupJid: g,
						groupSubject
					})
				}
				return await arr
			},
			enumerable: true,
			writable: true,
		},
		getName: {
			value(jid = '', withoutContact = false) {
				jid = conn.decodeJid(jid)
				withoutContact = conn.withoutContact || withoutContact
				let v
				if (jid?.endsWith('@g.us')) return (async () => {
					v = await store.fetchGroupMetadata(jid, conn.groupMetadata) || {}
					return v.name || v.subject || parsePhoneNumber('+' + jid.replace('@s.whatsapp.net', ''))?.number?.international || ''
				})()

				else v = jid === '0@s.whatsapp.net' ? {
					jid,
					vname: 'WhatsApp'
				} : areJidsSameUser(jid, conn.user?.id || '') ?
					conn.user :
					(store.getContact(jid) || {})
				return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName || parsePhoneNumber('+' + jid?.replace('@s.whatsapp.net', ''))?.number?.international || ''
			},
			enumerable: true,
			writable: true,
		},
		loadMessage: {
			value(jid, id) {
				if (!jid && !id) return null
				// if only 1 argument is passed, it is assumed to be a message id not a jid
				if (jid && !id) [id, jid] = [jid, null]
				return jid && id ? store.loadMessage(jid, id) : store.loadMessage(id)
			},
			enumerable: true,
			writable: true,
		},
		// TODO: Fix xml-notwell-format
		sendGroupV4Invite: {
			async value(jid, groupJid, inviteCode, inviteExpiration, groupName, jpegThumbnail, caption = 'Invitation to join my WhatsApp Group', options = {}) {
				// inspired from https://github.com/Hisoka-Morrou/hisoka-baileys/blob/master/lib/serialize.js
				const media = await prepareWAMessageMedia({ image: (await conn.getFile(jpegThumbnail)).data }, { upload: conn.waUploadToServer })
				const message = proto.Message.create({})
				message.groupInviteMessage = {
					groupJid,
					inviteCode,
					inviteExpiration: inviteExpiration ? parseInt(inviteExpiration) : +new Date(new Date() + (3 * 86400000)),
					groupName,
					jpegThumbnail: media.imageMessage?.jpegThumbnail || jpegThumbnail,
					caption
				}
				const m = generateWAMessageFromContent(jid, message, { userJid: conn.user?.id })
				await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } })
				return m
			},
			enumerable: true,
			writable: true
		},

		serializeM: {
			value(m) {
				return smsg(conn, m)
			},
			writable: true,
		},
		user: {
			get() {
				Object.assign(botUser, conn.authState.creds.me || {})
				return {
					...botUser,
					jid: botUser.id?.decodeJid?.() || botUser.id,
				}
			},
			set(value) {
				Object.assign(botUser, value)
			},
			enumerable: true,
			configurable: true,
		}
	})

	return sock
}
export function smsg(conn, m, hasParent) {
	if (!m) return m


	let M = proto.WebMessageInfo
	m = M.create(m)

	Object.defineProperty(m, 'conn', { enumerable: false, writable: true, value: conn })

	let protocolMessageKey
	if (m.message) {
		if (m.mtype == 'protocolMessage' && m.msg.key) {
			protocolMessageKey = m.msg.key
			if (protocolMessageKey == 'status@broadcast') protocolMessageKey.remoteJid = m.chat
			if (!protocolMessageKey.participant || protocolMessageKey.participant == 'status_me') protocolMessageKey.participant = m.sender
			protocolMessageKey.fromMe = areJidsSameUser(protocolMessageKey.participant, conn.user.id)
			if (!protocolMessageKey.fromMe && areJidsSameUser(protocolMessageKey.remoteJid, conn.user.id)) protocolMessageKey.remoteJid = m.sender
		}
		if (m?.quoted) if (!m.quoted.mediaMessage) delete m.quoted.download
	}
	if (!m.mediaMessage) delete m.download

	try {
		if (protocolMessageKey && m.mtype == 'protocolMessage') conn.ev.emit('messages.delete', { keys: [protocolMessageKey] })
	} catch (e) {
		console.error(e)
	}
	return m
}


// https://github.com/Nurutomo/wabot-aq/issues/490
const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage', 'ptvMessage', 'groupMentionedMessage']
export function serialize() {
	return Object.defineProperties(proto.WebMessageInfo.prototype, {
		conn: {
			value: Connection.conn,
			enumerable: false,
			writable: true
		},
		id: {
			get() {
				return this.key?.id
			}
		},
		isBaileys: {
			get() {
				return this.id?.startsWith('3EB0') && this.id?.length === 22 || false
			}
		},
		chat: {
			get() {
				const senderKeyDistributionMessage = this.message?.senderKeyDistributionMessage?.groupId
				return (
					this.key?.remoteJid ||
					(senderKeyDistributionMessage &&
						senderKeyDistributionMessage !== 'status@broadcast'
					) || ''
				).decodeJid()
			}
		},
		isGroup: {
			get() {
				return this.chat.endsWith('@g.us')
			},
			enumerable: true
		},
		sender: {
			get() {
				let candidates = [
					this.key?.fromMe && this.conn?.user?.jid,
					this.key?.participantAlt,
					this.key?.remoteJidAlt,
					this.participant,
					this.key?.participant,
					this.chat
				].filter(Boolean)

				let jid = candidates.find(jid => jid.endsWith('@s.whatsapp.net'))
				let lid = candidates.find(jid => jid.endsWith('@lid'))

				return this.conn?.decodeJid(jid || lid || candidates[0] || '')
			},
			enumerable: true
		},
		fromMe: {
			get() {
				const lid = this.conn?.decodeJid(this.conn?.user?.lid)
				return lid ? areJidsSameUser(lid, this.sender) : this.key?.fromMe || false
			}
		},
		mtype: {
			get() {
				if (!this.message) return ''
				return getContentType(this.message)
			},
			enumerable: true
		},
		msg: {
			get() {
				if (!this.message) return null
				let olist = Object.keys(this.message)[0] // FutureProofMessage
				if (this.message?.[olist]?.message) this.message = this.message[olist].message
				return this.message[this.mtype]
			}
		},
		mediaMessage: {
			get() {
				if (!this.message) return null
				const Message = ((this.msg?.url || this.msg?.directPath) ? { ...this.message } : extractMessageContent(this.message)) || null
				if (!Message) return null
				const mtype = Object.keys(Message)[0]
				return MediaType.includes(mtype) ? Message : null
			},
			enumerable: true
		},
		mediaType: {
			get() {
				let message
				if (!(message = this.mediaMessage)) return null
				return Object.keys(message)[0]
			},
			enumerable: true,
		},
		quoted: {
			get() {

				const self = this
				const msg = self.msg
				const contextInfo = msg?.contextInfo
				const quoted = contextInfo?.quotedMessage
				if (!msg || !contextInfo || !quoted) return null
				const type = Object.keys(quoted)[0]
				let q = quoted[type] || {}
				if (q.header) if (Object.keys(q.header).length > 1) {
					let keys = Object.keys(q.header)
					q.message = Object.fromEntries(Object.entries(q.header).filter(([key]) => key !== 'title'))
					for (let x of keys.filter(v => v !== 'title')) delete q.header[x]
				}
				if (q.message) { // FutureProofMessage
					let qm = q.message
					let qmo = Object.keys(qm)[0]
					if (qm[qmo].message) {
						let qmi = qm[qmo].message
						q = { ...qmi[Object.keys(qmi)[0]], ...qm[qmo] }
					} else q = { ...qm[qmo], ...q }
				}
				const text = typeof q === 'string' ? q : q.options ? q.name + '\n' + q.options.map(v => v.optionName).join('\n') : q.text
				return Object.defineProperties(JSON.parse(JSON.stringify(typeof q === 'string' ? { text: q } : q)), {
					mtype: {
						get() {
							return type
						},
						enumerable: true
					},
					mediaMessage: {
						get() {
							const Message = ((q.url || q.directPath) ? { ...quoted } : extractMessageContent(quoted)) || null
							if (!Message) return null
							const mtype = Object.keys(Message)[0]
							return MediaType.includes(mtype) ? Message : null
						},
						enumerable: true
					},
					mediaType: {
						get() {
							let message
							if (!(message = this.mediaMessage)) return null
							return Object.keys(message)[0]
						},
						enumerable: true,
					},
					id: {
						get() {
							return contextInfo.stanzaId
						},
						enumerable: true
					},
					chat: {
						get() {
							return contextInfo.remoteJid || self.chat
						},
						enumerable: true
					},
					isBaileys: {
						get() {
							return this.id?.startsWith('3EB0') && this.id?.length === 22 || false
						},
						enumerable: true
					},
					sender: {
						get() {
							let sender = contextInfo?.participant || this.chat || ''

							if (sender.endsWith('@lid')) {
								const match = db.data.lid[sender]
								if (match?.number) return match.number
								return sender
							}
							return sender.decodeJid()
						},
						enumerable: true
					},
					fromMe: {
						get() {
							return areJidsSameUser(this.sender, self.conn?.user.jid)
						},
						enumerable: true,
					},
					text: {
						get() {
							if (this.product) {
								const pdc = this.product
								return pdc.title + '\n' + pdc.description + '\n' + pdc.currencyCode + '\n' + pdc.priceAmount1000
							} else if (this.body || this.header || this.footer)
								return (this.header?.title || '') + '\n' + (this.body?.text || '') + '\n' + (this.footer?.text || '')
							else if (q?.startTime) return q.name + '\n' + (q.description || '')
							else return text || this.caption || this.contentText || this.selectedDisplayText || ''
						},
						enumerable: true
					},
					mentionedJid: {
						get() {
							let mention = q.contextInfo?.mentionedJid || self.getQuotedObj()?.mentionedJid || []
							mention = mention.map(jid => {
								if (jid.endsWith('@lid')) {
									const match = db.data.lid[jid]
									if (match?.number) return match.number
								}
								return jid
							})
							return mention;
						},
						enumerable: true
					},
					groupMentions: {
						get() {
							const gm = q.contextInfo?.groupMentions || self.getQuotedObj()?.groupMentions || []
							return gm.length ? gm.map(v => ({
								groupJid: v.groupJid,
								groupSubject: v.groupSubject
							})) : []
						},
						enumerable: true
					},
					name: {
						get() {
							const sender = this.sender
							return sender ? self.conn?.getName(sender) : null
						},
						enumerable: true

					},
					vM: {
						get() {
							return proto.WebMessageInfo.create({
								key: {
									fromMe: this.fromMe,
									remoteJid: this.chat,
									id: this.id,
									remoteJidAlt: this.remoteJidAlt,
									participantAlt: this.participantAlt
								},
								message: quoted,
								...(self.isGroup ? { participant: this.sender } : {})
							})
						}
					},
					fakeObj: {
						get() {
							return this.vM
						}
					},
					download: {
						value(saveToFile = false) {
							const msg = this.message || null
							const mtype = msg ? Object.keys(msg)[0] : this.mediaType
							return self.conn?.downloadM(msg ? msg[mtype] : this.mediaMessage[mtype], mtype.replace(/message/i, ''), { saveToFile })
						},
						enumerable: true,
						configurable: true,
					},
					reply: {
						value(text, chatId, options = {}) {
							return self.conn?.reply(chatId ? chatId : this.chat, text, this.vM, options)
						},
						enumerable: true,
					},
					copy: {
						value() {
							const M = proto.WebMessageInfo
							return smsg(conn, M.create(M.toObject(this.vM)))
						},
						enumerable: true,
					},
					forward: {
						value(jid, force = false, options = {}) {
							return self.conn?.sendMessage(jid, {
								forward: this.vM, force, ...options
							}, options)
						},
						enumerable: true,
					},
					copyNForward: {
						value(jid, forceForward = false, options = {}) {
							return self.conn?.copyNForward(jid, this.vM, forceForward, options)
						},
						enumerable: true,

					},
					cMod: {
						value(jid, text = '', sender = this.sender, options = {}) {
							return self.conn?.cMod(jid, this.vM, text, sender, options)
						},
						enumerable: true,

					},
					delete: {
						value() {
							return self.conn?.sendMessage(this.chat, { delete: this.vM.key })
						},
						enumerable: true,

					},
					react: {
						value(text) {
							return self.conn?.sendMessage(this.chat, {
								react: {
									text,
									key: this.vM.key
								}
							})
						},
						enumerable: true,
					}
				})
			},
			enumerable: true
		},
		_text: {
			value: null,
			writable: true,
		},
		text: {
			get() {
				const msg = this.msg
				const text = (typeof msg === 'string' ? msg : msg?.text) || msg?.caption
					|| msg?.contentText || msg?.nativeFlowResponseMessage || msg?.editedMessage
					|| (msg?.options ? msg.name + '\n' + msg.options.map(v => v.optionName).join('\n') : '')
					|| msg?.body || msg?.header || msg?.footer || ''
				if (msg?.body || msg?.header || msg?.footer) {
					if (text.paramsJson) return JSON.parse(text.paramsJson || '{}').id
					let txt = (msg.header?.title || '') + '\n' + (msg.body?.text || '') + '\n' + (msg.footer?.text || '')
					if (msg.nativeFlowMessage) {
						for (let x of (msg.nativeFlowMessage.buttons || [])) {
							let json = JSON.parse(x.buttonParamsJson)
							if (json.sections) {
								txt += '\n\n' + json.title
								for (let sec of Object.keys(json.sections))
									for (let obj of Object.values(json.sections[sec])) {
										if (typeof obj === 'string') txt += '\n' + obj
										else txt += '\n' + obj.map(v => Object.values(v).join('\n')).join('\n')
									}
							} else for (let tx of Object.keys(json)) txt += '\n' + json[tx]
						}
					}
					if (msg.carouselMessage) for (let x of (msg.carouselMessage.cards || [])) {
						txt += '\n\n' + (x.header?.title || '') + ', ' + (x.header?.subtitle || '') + ', ' + (x.body?.text || '') + ', ' + (x.footer?.text || '')
						if (x.nativeFlowMessage) {
							for (let y of (x.nativeFlowMessage.buttons || [])) {
								let json = JSON.parse(y.buttonParamsJson)
								for (let z of [...new Set(Object.values(json))]) txt += '\n' + z
							}
						}
					} return txt
				} else if (msg?.product) {
					const pdc = msg.product
					return pdc.title + '\n' + pdc.description + '\n' + pdc.currencyCode + '\n' + pdc.priceAmount1000
				} else if (msg?.contextInfo?.externalAdReply) {
					const adr = msg.contextInfo.externalAdReply
					return adr.title + '\n' + adr.thumbnailUrl + '\n' + adr.sourceUrl + '\n' + msg.text
				} else if (msg?.startTime) return msg.name + '\n' + (msg.description || '')
				else return typeof this._text === 'string' ? this._text : '' || (typeof text === 'string' ? text : (
					text?.conversation ||
					text?.selectedDisplayText ||
					text?.extendedTextMessage?.text ||
					text?.hydratedTemplate?.hydratedContentText ||
					text
				)) || ''
			},
			set(str) {
				return this._text = str
			},
			enumerable: true
		},
		mentionedJid: {
			get() {
				let mention = this.msg?.contextInfo?.mentionedJid?.length ? this.msg.contextInfo.mentionedJid : []
				mention = mention.map(jid => {
					if (jid.endsWith('@lid')) {
						const match = db.data.lid[jid]
						if (match?.number) return match.number
					}
					return jid
				})
				return mention
			},
			enumerable: true
		},
		groupMentions: {
			get() {
				return this.msg?.contextInfo?.groupMentions?.length ? this.msg.contextInfo.groupMentions.map(v => ({
					groupJid: v.groupJid,
					groupSubject: v.groupSubject
				})) : []
			},
			enumerable: true
		},
		name: {
			get() {
				return !nullish(this.pushName) && this.pushName || this.conn?.getName(this.sender)
			},
			enumerable: true
		},
		download: {
			value(saveToFile = false) {
				const msg = this.message || null
				const mtype = msg ? Object.keys(msg)[0] : this.mediaType
				return this.conn?.downloadM(msg ? msg[mtype] : this.mediaMessage[mtype], mtype.replace(/message/i, ''), { saveToFile })
			},
			enumerable: true,
			configurable: true
		},
		reply: {
			value(text, chatId, options = {}) {
				return this.conn?.reply(chatId ? chatId : this.chat, text, this, options)
			}
		},
		copy: {
			value() {
				const M = proto.WebMessageInfo
				return smsg(this.conn, M.create(M.toObject(this)))
			},
			enumerable: true
		},
		forward: {
			value(jid, force = false, options = {}) {
				return this.conn?.sendMessage(jid, {
					forward: this, force, ...options
				}, options)
			},
			enumerable: true
		},
		copyNForward: {
			value(jid, forceForward = false, options = {}) {
				return this.conn?.copyNForward(jid, this, forceForward, options)
			},
			enumerable: true
		},
		cMod: {
			value(jid, text = '', sender = this.sender, options = {}) {
				return this.conn?.cMod(jid, this, text, sender, options)
			},
			enumerable: true
		},
		getQuotedObj: {
			value() {
				if (!this.quoted.id) return null
				const q = proto.WebMessageInfo.create(this.conn?.loadMessage(this.quoted.sender, this.quoted.id) || this.conn?.loadMessage(this.quoted.id) || this.quoted.vM)
				return smsg(this.conn, q)
			},
			enumerable: true
		},
		getQuotedMessage: {
			get() {
				return this.getQuotedObj
			}
		},
		delete: {
			value() {
				return this.conn?.sendMessage(this.chat, { delete: this.key })
			},
			enumerable: true
		},
		react: {
			value(text) {
				return this.conn?.sendMessage(this.chat, {
					react: {
						text,
						key: this.key
					}
				})
			},
			enumerable: true
		}
	})
}

export function logic(check, inp, out) {
	if (inp.length !== out.length) throw new Error('Input and Output must have same length')
	for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i]
	return null
}

export function protoType() {
	Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
		const ab = new ArrayBuffer(this.length)
		const view = new Uint8Array(ab)
		for (let i = 0; i < this.length; ++i) {
			view[i] = this[i]
		}
		return ab;
	}
	Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
		return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength)
	}
	ArrayBuffer.prototype.toBuffer = function toBuffer() {
		const buf = Buffer.alloc(this.byteLength)
		const view = new Uint8Array(this)
		for (let i = 0; i < buf.length; ++i) {
			buf[i] = view[i]
		}
		return buf;
	}

	Uint8Array.prototype.getFileType =
		ArrayBuffer.prototype.getFileType =
		Buffer.prototype.getFileType = function getFileType() {
			return fileTypeFromBuffer(this)
		}
	String.prototype.isNumber =
		Number.prototype.isNumber = function isNumber() {
			const int = parseInt(this)
			return typeof int === 'number' && !isNaN(int)
		}
	String.prototype.capitalize = function capitalize() {
		return this.charAt(0).toUpperCase() + this.slice(1, this.length)
	}
	String.prototype.capitalizeV2 = function capitalizeV2() {
		const str = this.split(' ')
		return str.map(v => v.capitalize()).join(' ')
	}
	String.prototype.decodeJid = function decodeJid() {
		if (/:\d+@/gi.test(this)) {
			const decode = jidDecode(this) || {}
			return (decode.user && decode.server && decode.user + '@' + decode.server || this).trim()
		} else return this.trim()
	}
	Number.prototype.toTimeString = function toTimeString() {
		const seconds = Math.floor((this / 1000) % 60)
		const minutes = Math.floor((this / (60 * 1000)) % 60)
		const hours = Math.floor((this / (60 * 60 * 1000)) % 24)
		const days = Math.floor((this / (24 * 60 * 60 * 1000)))
		return (
			(days ? `${days} day(s) ` : '') +
			(hours ? `${hours} hour(s) ` : '') +
			(minutes ? `${minutes} minute(s) ` : '') +
			(seconds ? `${seconds} second(s)` : '')
		).trim()
	}
	Number.prototype.getRandom =
		String.prototype.getRandom =
		Array.prototype.getRandom = function getRandom() {
			if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)]
			return Math.floor(Math.random() * this)
		}

}

function nullish(args) {
	return !(args !== null && args !== undefined)
}

function sendPresence(type, conn, jid) {
	if (jid) return conn.sendPresenceUpdate?.(type, jid)
}