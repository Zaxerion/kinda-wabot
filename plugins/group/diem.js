import db from '../../lib/database.js'
import { isNumber, somematch } from '../../lib/func.js'

const DEFAULT_COOLDOWN = 60000 

let handler = async (m, { conn, participants, usedPrefix, command, args }) => {
  if ((!m.quoted && !args[1]) || (m.quoted && !args[0])) {
    throw `Format: ${usedPrefix + command} <timer> <@tag/quote>\n1 = 1 menit\n5 = 5 menit ... dst.\n\nContoh : *${usedPrefix + command} 10 @Alan*`
  }

  let totalTime = Math.floor(isNumber(args[0]) ? Math.min(Math.max(parseInt(args[0]), -9999), 9999) : 1)

  let target = args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.quoted ? m.quoted.sender : m.mentionedJid ? m.mentionedJid[0] : ''
  if (!target) throw 'Tag salah satu pengguna.'

  let ow = db.data.datas
  let dataOwner = [...ow.rowner.filter(([id, isCreator]) => id && isCreator), ...ow.owner.filter(([id, isCreator]) => id && isCreator)].map(v => v[0] + '@s.whatsapp.net')
  if (somematch(dataOwner, target) || target === conn.user.jid) throw `Tidak boleh memblokir diri sendiri atau owner!`

  let user = db.data.users[target]
  if (!user) throw `User tidak ada dalam database.`
  if (user.permaban) throw `[!] Tidak perlu *${command}* karena sudah di *ban*`

  if (user.banned) {
    let now = new Date().getTime()
    let elapsed = now - user.lastbanned
    let remainingMs = Math.max(0, user.bannedcd - elapsed)
    let remainingMin = remainingMs / DEFAULT_COOLDOWN

    let newMuteTime = Math.max(1, remainingMin + totalTime)

    user.bannedcd = DEFAULT_COOLDOWN * Math.round(newMuteTime)
    user.lastbanned = now

    await conn.reply(m.chat, `User @${target.split('@')[0]} waktu mute diubah menjadi ${Math.round(newMuteTime)} menit.`, fliveLoc, { mentions: [target] })

  } else {
    await conn.sendMsg(m.chat, { react: { text: '👍🏻', key: m.key } })
    user.banned = true
    user.lastbanned = new Date().getTime()
    user.bannedcd = DEFAULT_COOLDOWN * totalTime
    user.spamcount = 0

    await conn.reply(m.chat, `User @${target.split('@')[0]} di *mute* selama ${totalTime} menit.`, fliveLoc, { mentions: [target] })
  }
}

handler.menugroup = ['mute <timer> @tag']
handler.tagsgroup = ['group']
handler.command = /^(mute)$/i
handler.owner = true

export default handler
