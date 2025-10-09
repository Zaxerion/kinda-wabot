import db from '../../lib/database.js'

export async function all(m) {
    if (m.chat.endsWith('broadcast') || m.fromMe || m.chat.endsWith('@g.us') || m.chat.endsWith('@newsletter')) return

    let user = db.data.users[m.sender]
    if (new Date() - user.pc < 259200000) return
    await m.reply(`*TOLONG DIBACA*
- Silakan kirim link gc ke owner jika ingin memasukan bot
- Ketik .menu/.help untuk memunculkan list perintah

Jika ada keperluan lain bisa pm owner :
wa.me/6285157571221
`)

    user.pc = new Date * 1
}