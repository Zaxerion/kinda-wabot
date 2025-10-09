import { queue } from '../../lib/func.js'

let handler = async (m, { conn, text, participants }) => {
  const senderId = m.sender.split('@')[0]
  let q = m.quoted || m;
  let mime = q?.mimetype || q?.mediaType || '';
  text = text ? text : m.quoted?.text ? m.quoted.text : m.quoted?.caption ? m.quoted.caption : m.quoted?.description ? m.quoted.description : ''

  let mentions = participants.map(a => a.id)

  if (!text) {
    text = `Kamu dipanggil oleh @${senderId}`
    if (!mentions.includes(m.sender)) mentions.push(m.sender)
  }


  await queue.add(async () => {
    try {
      if (/video|image/.test(mime) && !/webp/.test(mime)) {
        let media = await q.download?.()
        if (media) {
          await conn.sendFile(m.chat, media, '', text, null, false, { mentions })
        } else {
          await conn.reply(m.chat, text, null, { mentions })
        }
      } else {
        await conn.reply(m.chat, text, null, { mentions })
      }
    } catch (e) {
      console.error('Hidetag error:', e.message)
      await conn.reply(m.chat, text, null, { mentions })
    }
  })
}

handler.menugroup = ['hidetag <blank/teks/reply>'];
handler.tagsgroup = ['group'];
handler.command = /^(h(idetag)?)$/i;

handler.help = ['hidetag <blank/teks/reply>'];
handler.tags = ['Menu Group'];

handler.admin = true;
handler.group = true;

export default handler;
