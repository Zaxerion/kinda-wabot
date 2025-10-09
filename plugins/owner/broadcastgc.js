import { delay } from '../../lib/func.js'

let handler = async (m, { conn, text }) => {
    let groups = Object.values(await conn.groupFetchAllParticipating()).filter(v => v.participants.find(v => v.jid == conn.user.jid) != undefined)
    let img, thumb, q = m.quoted ? m.quoted : m
    text = text ? text : m.quoted?.text ? m.quoted.text : m.quoted?.caption ? m.quoted.caption : m.quoted?.description ? m.quoted.description : ''
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    if (mime) img = await q.download()

    const contextInfo = {
        externalAdReply: {
            title: 'Broadcast',
            mediaType: 1,
            renderLargerThumbnail: false,
            thumbnail: global.thumbnail,
            thumbnailUrl: `https://kinda.icu/redir/${global.imageId}`,
        }
    }

    for (let x of groups) {
        if (x.announce && !x.participants.find(v => v.id == conn.user.jid).admin) {
            console.log(x.id + '\ngroup closed / bot not admin')
        } else {
            try {
                if (/webp/.test(mime)) {
                    await conn.sendMessage(x.id, { sticker: img })
                } else if (/image|video/g.test(mime) && !/webp/.test(mime)) {
                    await conn.sendMessage(x.id, {
                        [/image/.test(mime) ? 'image' : 'video']: img, caption: text,
                        contextInfo
                    });
                } else if (/audio/.test(mime)) {
                    await conn.sendMessage(x.id, {
                        audio: img, mimetype: 'audio/mpeg', ptt: true,
                        contextInfo
                    });
                } else {
                    conn.relayMessage(x.id, {
                        extendedTextMessage: {
                            text: text + '\n',
                            contextInfo: {
                                externalAdReply: {
                                    title: 'Broadcast',
                                    mediaType: 1,
                                    renderLargerThumbnail: false,
                                    thumbnail: global.thumbnail,
                                    thumbnailUrl: `https://kinda.icu/redir/${global.imageId}`,
                                }
                            },
                        }
                    }, { quoted: fkontak });
                }

                await delay(15000);
            } catch (e) {
                console.log(e)
            }
        }
    }
    m.reply(`Broadcast message sent to ${groups.length} groups.`)
}

handler.menuowner = ['bcgc']
handler.tagsowner = ['owner']
handler.command = /^((bc|broadcast)(gc|gro?ups?)((hide)?tag)?)$/i

handler.owner = true

export default handler
