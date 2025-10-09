import { readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'

let handler = async (m, { conn, usedPrefix, args }) => {
	const sesi = ['./sessions']
	const deletedFiles = []
    let user = m.sender.split`@`[0]
    let gc = m.chat

	const patterns = [user, gc]
    console.log(patterns)
	sesi.forEach(dirname => {
		readdirSync(dirname).forEach(file => {
			if (patterns.some(pattern => file.includes(pattern))) {
				const filePath = join(dirname, file)
				const stats = statSync(filePath)
				
				if (stats.isFile()) {
					unlinkSync(filePath)
					deletedFiles.push(filePath)
				} else {
				}
			}
		})
	})

	m.reply('*HANYA GUNAKAN FIXBOT KETIKA BOT TIDAK MERESPON, JIKA BOT MASIH MEMBERI REACT TANDANYA BOT MASIH RESPON DAN BEREFUNGSI NORMAL*\n\nBot berhasil di fix, kirim beberapa pesan sebelum menggunakan bot kembali!')
}

handler.menugroup = ['fixbot']
handler.tagsgroup = ['group']
handler.command = /^(fixbot)$/i

handler.help = ['fixbot'];
handler.tags = ['Menu Group'];

export default handler
