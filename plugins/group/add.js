import db from '../../lib/database.js'

let handler = async (m, { conn, text, participants, usedPrefix, command }) => {
    const _participants = participants.map(user => user.id);

    let numbers = []

    if (m.quoted && m.quoted.vcard) {
        let vcard = m.quoted.vcard
        let matches = [...vcard.matchAll(/waid=(\d+)/g)].map(v => v[1])
        numbers.push(...matches)
    }

    if (text) {
        numbers.push(...text.split(',').map(v => v.replace(/[^0-9]/g, '')))
    }

    numbers = [...new Set(numbers)] 
        .filter(v => v.length > 4 && v.length < 20 && !_participants.includes(v + '@s.whatsapp.net'))

    if (!numbers.length) throw `_Masukan nomor!_\nContoh:\n\n${usedPrefix + command} ${db.global.owner[0]}`
    m.reply('_Sedang di proses..._');

    const users = await Promise.all(
        numbers.map(async v => {
            const userCheck = await conn.onWhatsApp(v + '@s.whatsapp.net')
            return userCheck[0]?.exists ? v + '@c.us' : null
        })
    ).then(results => results.filter(Boolean))

    const response = await conn.groupParticipantsUpdate(m.chat, users, "add")

    for (const participant of response) {
        const jid = participant.content.attrs.phone_number
        const status = participant.status

        if (status === '408') {
            conn.reply(m.chat, `Tidak dapat menambahkan @${jid.split('@')[0]}!\nMungkin @${jid.split('@')[0]} baru keluar dari grup ini atau dikick`, m)
        } else if (status === '403') {
            const inviteCode = participant.content.content[0].attrs.code
            const inviteExp = participant.content.content[0].attrs.expiration
            
            try {
                await conn.sendGroupV4Invite(
                    jid,
                    m.chat,
                    inviteCode,
                    parseInt(inviteExp),
                    await conn.getName(m.chat),
                    'Undangan untuk bergabung ke grup WhatsApp saya',
                    undefined 
                )
                
                await m.reply(`Berhasil mengirim undangan ke ${jid.split('@')[0]}`)
                
            } catch (error) {
                console.error('Error sending invite:', error)
                try {
                    const groupInvite = await conn.groupInviteCode(m.chat)
                    const inviteLink = `https://chat.whatsapp.com/${groupInvite}`
                    
                    await conn.sendMessage(jid, {
                        text: `📨 *Undangan Bergabung Grup*\n\nAnda diundang untuk bergabung ke grup:\n*${await conn.getName(m.chat)}*\n\nLink: ${inviteLink}\n\nLink ini berlaku untuk 3 hari.`
                    })
                    
                    await m.reply(`Berhasil mengirim undangan link ke @${jid.split('@')[0]}`)
                    
                } catch (fallbackError) {
                    console.error('Fallback juga gagal:', fallbackError)
                    conn.reply(m.chat, `❌ Gagal mengirim undangan ke @${jid.split('@')[0]}`, m)
                }
            }
        }
    }
}

handler.menugroup = ['add']
handler.tagsgroup = ['group']
handler.command = /^(o?add)$/i

handler.help = ['add']
handler.tags = ['Menu Group']

handler.admin = true
handler.botAdmin = true
handler.group = true

export default handler