import axios from 'axios';

let handler = async (m, { text }) => {
    const searchQuery = text.trim().toLowerCase();

    if (searchQuery.length < 3) {
        await m.reply('Masukkan minimal 3 huruf dari nama regist.\nContoh: .regis chi');
        return;
    }

    try {
        const res = await axios.get(global.API("zax", "/api/toram/regist", { text }, "apikey"));
        const data = res.data.result;

        const filtered = data.filter(item =>
            (item.id && item.id.toLowerCase().includes(searchQuery)) ||
            (item.en && item.en.toLowerCase().includes(searchQuery))
        );

        if (filtered.length === 0) {
            await m.reply(`Registlet '${searchQuery}' tidak ditemukan dalam daftar regis.`);
            return;
        }

        let message = '\n──────────────────\n\n';
        for (const item of filtered) {
            const dropFormatted = Array.isArray(item.drop) ? item.drop.join(', ') : '-';
            const descSection = item.desc ? `Desc:\n${item.desc}\n` : 'Desc: \n';
            message += `${item.id || '-'} / ${item.en || '-'}\nLv: ${dropFormatted}\n${descSection}\n──────────────────\n\n`;
        }

        await m.reply(message.trim());
    } catch (err) {
        const msg = err?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};

handler.command = /^regis(t(let)?)?$/i
handler.menutoram = ['regist <nama regist>'];
handler.tagstoram = ['tram'];
handler.help = ['regist <nama regist>'];
handler.tags = ['tram'];

export default handler;
