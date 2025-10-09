import db from '../../lib/database.js'
import fs from 'fs'

const nol = '0@s.whatsapp.net'

let handler = m => m
	handler.all = async function (m) {
	let d = new Date(new Date + 3600000)
	let timeh = `🕰️ ${d.toLocaleTimeString('id', { hour: 'numeric', minute: 'numeric', second: 'numeric' }).replaceAll('.',':')}`
	let datas = db.data.datas
	global.packname = datas.packname
	global.author = datas.author
	global.pauthor = datas.packname + ' - ' + datas.author
	global.ephemeral = '86400' // 86400 = 24jam, kalo ingin di hilangkan ganti jadi 'null' atau ''
	global.timeh = `🕰️ ${d.toLocaleTimeString('id', { hour: 'numeric', minute: 'numeric', second: 'numeric' }).replace(/./,':')}`
	
	const fake = async (remoteJid, jid) => {
		const pure = {
			key: {
				remoteJid,
				fromMe: true,
				id: 'BAE5AB0B84194996'
			},
			message: {
				contactMessage: {
					displayName: await this.getName(jid),
					vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${pauthor};;;\nFN:${pauthor}\nTEL;type=CELL;type=VOICE;waid=${jid.split('@')[0]}:${jid.split('@')[0]}\nEND:VCARD`
				}
			},
			status: 'PENDING',
			messageTimestamp: '1696595373'
		}
		return pure
	}
	const extras = { messageTimestamp: '1696603624', broadcast: false, pushName: pauthor }
	const key = { remoteJid: this.user.jid, fromMe: false, id: '97AA99F78F1C398AE87C26055FEB5AB1' }
	global.fkontak = await fake(nol, m.sender)
	global.fkontakbot = await fake(nol, this.user.jid)
	global.fowner = await fake(nol, '6285157571221@s.whatsapp.net')

	global.thumbnailUrl = [
		'https://telegra.ph/file/ef4b742d47e6a9115e2ff.jpg'
	]
	
	global.fvn = {
		key, message: { 
			audioMessage: {
				mimetype: 'audio/ogg; codecs=opus',
				seconds: 10,
				ptt: true
			}
		},
		...extras
	}
	
	global.fvid = {
		key, message: {
			videoMessage: {
				title: pauthor,
				h: 'Hmm',
				seconds: '12345',
				caption: timeh,
				jpegThumbnail: global.thumbnail
			}
		},
		...extras
	}
	// fake location
	global.fliveLoc = {
		key, message: {
			liveLocationMessage: {
				caption: pauthor, // title: pauthor, // see the differences
				h: timeh,
				jpegThumbnail: global.thumbnail
			}
		},
		...extras
	}
	//fake document
	global.fdocs = {
		key, message: {
			documentMessage: {
				title: pauthor, 
				jpegThumbnail: global.thumbnail
			}
		},
		...extras
	}
	// fake gif
	global.fgif = {
		key, message: { 
			videoMessage: {
				title: pauthor,
				h: 'Hmm',
				seconds: '999999999', 
				gifPlayback: 'true', 
				caption: timeh,
				jpegThumbnail: global.thumbnail
			}
		},
		...extras
	}
	//fake troli
	global.ftroli = {
		key, message: {
			orderMessage: {
				itemCount: 1000,
				status: 1,
				surface: 1,
				message: timeh,
				ordertitle: pauthor,
				sellerJid: nol
			}
		},
		...extras
	}
	//fake troli2
	global.ftrol = {
		key, message: {
			orderMessage: {
				itemCount : 1000,
				//status: 1,
				//surface : 1,
				message: pauthor,
				//orderTitle: `anulah`,
				thumbnail: global.thumbnail,
				sellerJid: nol 
			}
		},
		...extras
	}
	// fake toko
	global.ftoko = {
		key, message: {
			productMessage: {
				product: {
					productImage: {
						mimetype: 'image/jpeg',
						jpegThumbnail: global.thumbnail
					},
					title: pauthor,
					description: timeh, 
					currencyCode: 'IDR',
					priceAmount1000: 25000000,
					retailerId: 'Ghost',
					productImageCount: 1
				},
				businessOwnerJid: nol
			}
		},
		...extras
	}
}

export default handler