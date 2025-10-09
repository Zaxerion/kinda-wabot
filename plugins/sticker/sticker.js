import { sticker, sticker3, addExif, video2webp } from '../../lib/sticker.js'
import { isUrl } from '../../lib/func.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let c = command
  try {
    if (isUrl(text)) {
      let s = await sticker(false, text, packname, author)
      await conn.sendFile(m.chat, s, '', '', m)
    } else {
      let buffer, q = m.quoted ? m.quoted : m
      let mime = (q.msg || q).mimetype || q.mediaType || ''
      let fps = 15
      if (/image|video/g.test(mime)) {
        let ch, img = await q.download?.()
        let sec = (q.msg || q)?.seconds || 0

        if (/video/g.test(mime)) {
          if (sec > 30) return m.reply('⛔ Maksimal durasi video 15 detik!')
          await conn.sendMessage(m.chat, { react: { text: '⏱️', key: m.key } })
          ch = (q.gifPlayback || q.message?.videoMessage?.gifPlayback) ? 1 : 2
        } else ch = 0

        if (ch > 0) {
          buffer = await (
            /webp/.test(mime)
              ? addExif(img, packname, author)
              : ch > 1
              ? addExif(await video2webp(img, fps), packname, author)
              : await sticker(img, false, packname, author)
          )
        } else {
          try {
            buffer = await addExif(await sticker3(img, false), packname, author)
          } catch {
            buffer = await sticker(img, false, packname, author)
          }
        }
        await conn.sendFile(m.chat, buffer, '', '', m)
      } else {
        return m.reply(`📎 Kirim gambar atau video berdurasi ≤15 detik dengan caption *${usedPrefix + c}*`)
      }
    }
  } catch (e) {
    console.error(e)
    throw '⚠️ Konversi gagal, coba lagi.'
  }
}

handler.help = ['sticker']
handler.tags = ['Menu Sticker']
handler.command = /^s(tic?ker)?(gif)?$/i

export default handler
