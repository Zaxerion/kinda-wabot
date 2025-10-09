import { toAudio } from '../../lib/converter.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    let chat = '123'
    let q = m.quoted ? m.quoted : m
    let mime = (m.quoted ? m.quoted : m.msg).mimetype || ''
    if (!/video|audio/.test(mime)) throw `reply video/voice note you want to convert to audio/mp3 with caption *${usedPrefix + command}*`
    let media = await q.download?.()
    if (!media) throw 'Can\'t download media'
    let audio = await toAudio(media, 'mp4')
    if (!audio.data) throw 'Can\'t convert media to audio'
    conn.sendFile(m.chat, audio.data, 'audio.mp3', '', m, null, { mimetype: 'audio/mp4', asDocument: chat.useDocument })
}


handler.help = ['toaudio', 'tomp3', 'tovn'].map(v => v + ' (reply)')
handler.tags = ['tools']
handler.command = /^(to(vn|a(udio)?|mp3))$/i

export default handler
