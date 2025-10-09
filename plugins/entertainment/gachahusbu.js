import db from '../../lib/database.js';

const skip = [
    '1',
];

const fetchJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};

const handler = async (m, { conn, text }) => {
    let input = m.sender.replace(/@s\.whatsapp\.net$/, '');
    db.data.users[m.sender] = db.data.users[m.sender] || {};
    db.data.users[m.sender].husbu = db.data.users[m.sender].husbu || {};

    const todayStr = new Date().toISOString().slice(0, 10);

    let saved = db.data.users[m.sender].husbu;

    if (!skip.includes(input) && saved.date === todayStr) {
        return conn.sendMsg(m.chat, {
            image: { url: saved.link, fileName: 'husbu.jpg' },
            caption: saved.caption,
            mentions: [m.sender],
        }, { quoted: m });
    }

    try {
        await conn.sendMsg(m.chat, { react: { text: '⏳', key: m.key } });

        const result = await fetchJson(global.API("zax", "/api/etc/husbu", { q: input }, "apikey"));

        if (result?.success && result.data) {
            const { large, source, primary } = result.data;

            const caption = `husbu @${input} hari ini\n\n` +
                `Name: ${primary}\n` +
                `Source: ${source || "Unknown"}`;

            db.data.users[m.sender].husbu = {
                date: todayStr,
                link: large,
                caption
            };

            await conn.sendMsg(m.chat, {
                image: { url: large, fileName: 'husbu.jpg' },
                caption,
                mentions: [m.sender]
            }, { quoted: m });

        } else {
            m.reply('Tidak ada husbu yang tersedia dari API.');
        }

    } catch (err) {
        console.error('Error:', err);
        m.reply('Terjadi kesalahan saat mengambil husbu dari API.');
    }
};


handler.command = /^husbu$/i;
handler.menufun = ['husbu'];
handler.tagsfun = ['gacha'];

handler.help = ['husbu'];
handler.tags = ['Menu Fun'];

export default handler;