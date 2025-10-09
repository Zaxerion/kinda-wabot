import db from '../../lib/database.js';

const fetchJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

const skip = [
    '6285157571221',
    '6281617827738',
    '62895620004772',
];

const handler = async (m, { conn, text }) => {
    let input = m.sender.replace(/@s\.whatsapp\.net$/, '');
    db.data.users[m.sender] = db.data.users[m.sender] || {};
    db.data.users[m.sender].waifu = db.data.users[m.sender].waifu || {};

    const todayStr = new Date().toISOString().slice(0, 10);


    let saved = db.data.users[m.sender].waifu;
     if (!skip.includes(input) && saved.date === todayStr) {
        return conn.sendMsg(m.chat, {
            image: { url: saved.link, fileName: 'Waifu.jpg' },
            caption: saved.caption,
            mentions: [m.sender]
        }, { quoted: m });
    }

    try {
        await conn.sendMsg(m.chat, { react: { text: '⏳', key: m.key } });

        const result = await fetchJson(global.API("zax", "/api/etc/waifu", { q: input }, "apikey"));

        if (result?.success && result.data) {
            const { large, source, primary } = result.data;

            const caption = `Waifu @${input} hari ini\n\n` +
                            `Name: ${primary}\n` +
                            `Source: ${source || "Unknown"}`;

            db.data.users[m.sender].waifu = {
                date: todayStr,
                link: large,
                caption
            };

            await conn.sendMsg(m.chat, {
                image: { url: large, fileName: 'Waifu.jpg' },
                caption,
                mentions: [m.sender]
            }, { quoted: m });

        } else {
            m.reply('Tidak ada waifu yang tersedia dari API.');
        }

    } catch (err) {
        console.error('Error:', err);
        m.reply('Terjadi kesalahan saat mengambil waifu dari API.');
    }
};

handler.menufun = ['waifu <nama>'];
handler.tagsfun = ['gacha'];
handler.command = /^(waifu)$/i;

handler.help = ['waifu'];
handler.tags = ['Menu Fun'];

export default handler;