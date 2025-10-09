import axios from 'axios';

let handler = async (m, { text, usedPrefix, command }) => {
    if (!text) return m.reply(`Silakan masukkan level‑mu, contoh: ${usedPrefix + command} 143`);

    try {
        const response = await axios.get(global.API("zax", "/api/toram/lvling", { text, limit: 10, format: 'md' }, "apikey"));
        
        const res = response.data.data
        console.log(res)
        m.reply(res);
    } catch (error) {
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};


handler.command = /^(lv(l)?(ing)?|level(ing)?)$/i;
handler.menutoram = ['lvl 1-999'];
handler.tagstoram = ['tram'];
handler.help = ['lvl 1-999'];
handler.tags = ['tram'];

export default handler;
