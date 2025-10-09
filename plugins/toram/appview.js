import axios from 'axios';

let handler = async (m, { conn, text }) => {
    if (!text) {
        return m.reply('Masukan nama app yang ingin dilihat.\nContoh:\n.appview rose');
    }

    try {
        const { data } = await axios.get(global.API("zax", "/api/toram/appview", { text }, "apikey"));

        if (!data.success || !data.data || data.data.length === 0) {
            return m.reply('Item tidak ditemukan, coba cari dengan bahasa Inggris.');
        }

        let results = data.data;
        let first = results[0];

        let others = results.slice(1).map((item) => `- ${item.name}`).join('\n');

        let caption = `*${first.name}* ${first.type}`;
        if (others) {
            caption += `\n\nTerdapat lebih dari 1 hasil.\nPersempit pencarian atau ketik nama lengkap:\n${others}`;
        }

        conn.sendMsg(m.chat, {
            image: { url: first.image, fileName: 'item.jpg' },
            caption,
            mentions: [m.sender]
        }, { quoted: m });

    } catch (err) {
        const msg = err?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        m.reply(msg);
    }
};


handler.command = /^app(s)?view(s)?$/i;
handler.menutoram = ['appview']
handler.tagstoram = ['sram']

handler.help = ['appview']
handler.tags = ['tram']

export default handler;
