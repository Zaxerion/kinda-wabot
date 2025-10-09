let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `Masukan teks saran\n\ncontoh:\n${usedPrefix + command} min botnya tolong tambah fitur ini dong`

    let teks = `*${command.toUpperCase()} DARI* @${m.sender.split`@`[0]}\n\nPesan : \n${text}\n`

    await conn.sendMessage(global.nomorown + '@s.whatsapp.net', {
        text: m.quoted ? teks + m.quoted.text : teks,
        contextInfo: {
            mentionedJid: [m.sender]
        }
    })

    m.reply(`_Pesan terkirim ke pemilik bot_`)
}
handler.help = ['saran <teks>']
handler.tags = ['tools']
handler.command = /^(saran)$/i

export default handler