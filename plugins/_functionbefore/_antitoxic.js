import db from '../../lib/database.js'

let badwordRegex = /[a4]nj([kg]|n?[gk])|[a4]?nj[i1][n9]?[gk]|[a4]jg|[a4]jy|b[a4]j[i1]ng[a4]n|b[a4]ngs[a4]t|k[o0]?[n9]t[o0]?[l1]|m[e3]?[m]+[e3]?[kq]|p[e3]?[p]+[e3]?[kq]|m[e3]k[i1]|t[i1]t[i1]([td])|p[e3]l[e3]r|t[e3]t[e3]k|t[o0]k[e3]t|ng[e3]w[e3]|g[o0]?[b8]l[o0]?[kq]|t[o0]?[l1]o[l1]|[i1]d[i1][o0]t|(k|ng)[e3]?[n9]t[o0]?[td]|j[e3]mb[u7]t|b[e3]g[o0]|d[a4]j{1,2}[a4]l|j[a4]nc[u0o]|p[a4]nt[e3]k|p[u7]k[i1] ?(m[a4]k)?|k[i1]m[a4]k|k[a4]mp[a4]ng|l[o0]nt[e3]|c[o0]l([i1]|m[e3]?[kq])|p[e3]l[a4]c[u7]r|h[e3]nc[e3]?[u7]?[t7]|n[i1]gg[a4]|f[u7]ck|d[i1]ck|b[i1]tch|t[i1]ts|b[a4]st[a4]rd|[a4]ssh[o0]l[e3]|d[o0]nt[o0]l|k[o0]nt[o0][i1]|[o0]nt[o0]l|b[e3]nc[o0]ng|b[a4]n[cq][i1]|h[o0]m[o0]|j[a4]bl[a4]y?|c[a4]b[e3]|s[e3]t[a4]n|d[o0]ng[o0]|b[e3]rh[a4]h[i1]|cr[o0]t|ng[e3]s[e3]k|w[i1]kw[i1]k|p[e3]l[o0]r|m[a4]ny[e3]t|s[i1]p[i1]t|k[a4]sr[i1]|g[i1]bl[o0]k|b[a4]nd[i1]t|g[o0]bl[o0]k|t[a4]i/;

export async function before(m, { isBotAdmin }) {
    if (m.fromMe) return !0
    if (!isBotAdmin) return !0
    if (!db.data.datas.lastReset) db.data.datas.lastReset = '';

    let chat = db.data.chats[m.chat]
    let user = db.data.users[m.sender]
    let isBadword = badwordRegex.test(m.text);

    if (!user.warning) {
        user.warning = 0;
    }

    if (chat.antiToxic && isBadword) {
        user.warning += 1
        await this.sendMsg(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.id, participant: m.sender } })

        await this.sendMsg(m.chat, { text: `@${m.sender.replace(/@s\.whatsapp\.net/g, '')} Jangan Toxic ya!!\nKamu memiliki ${user.warning}/15 warning\n\nGunakan .off antitoxic untuk mematikan`, mentions: [m.sender] })

        if (user.warning >= 15) {
            user.warning = 0
            if (m.isGroup) {
                if (isBotAdmin) {
                    try {
                        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
                    } catch (e) {
                        console.error('Kick failed:', e)
                        m.reply('Gagal kick')
                    }
                }
            }
        }
    }
    return !0
}