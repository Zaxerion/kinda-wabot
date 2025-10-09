const link = 'https://data.bmkg.go.id/DataMKG/TEWS/'

let handler = async (m, { conn, text, usedPrefix, command }) => {
	if (text) return
	try {
		let anu = await (await fetch(link+'autogempa.json')).json()
		anu = anu.Infogempa.gempa
		let txt = `*${anu.Wilayah}*\n\n`
		txt += `Tanggal : ${anu.Tanggal}\n`
		txt += `Waktu : ${anu.Jam}\n`
		txt += `Potensi : *${anu.Potensi}*\n\n`
		txt += `Magnitude : ${anu.Magnitude}\n`
		txt += `Kedalaman : ${anu.Kedalaman}\n`
		txt += `Koordinat : ${anu.Coordinates}${anu.Dirasakan.length > 3 ? `\nDirasakan : ${anu.Dirasakan}` : ''}`
		let msg  = await conn.sendMsg(m.chat, { location: { degreesLatitude: anu.Coordinates.split(',')[0], degreesLongitude: anu.Coordinates.split(',')[1] } })
		await conn.sendFile(m.chat, link+anu.Shakemap, '', txt.replaceAll('%p','```'), msg)
	} catch (e) {
		console.log(e)
		m.reply(`[!] Fitur Error.`)
	}
}

handler.help = ['infogempa']
handler.tags = ['information']
handler.command = /^((info)?gempa)$/i

export default handler