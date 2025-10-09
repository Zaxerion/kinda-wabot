import axios from 'axios';

let handler = async (m, { text }) => {
    if (!text) {
        return m.reply(`list stats ketik .cheatsheet

maksimal positif dan negatif stats = 6
untuk positif isi dengan angka / max
untuk negatif isi dengan angka / min
dte, rte adalah fire, ele lain cek di list

Contoh 
*.fillarm str%=10, cd=23, cr=29, dte%=23, matk%=min, mp%=min, acc=min, acc%=min, pot=65, proff=260*`);
    }
    try {
        const response = await axios.get(global.API("zax", "/api/toram/fillarm", { q: text }, "apikey"));

        const res = response.data.data
        m.reply(res, null, { linkPreview: false });
    } catch (error) {
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};

handler.command = /^fillarm$/i;
handler.menutoram = ['fillarm'];
handler.tagstoram = ['sram'];
handler.help = ['fillarm'];
handler.tags = ['tram'];

export default handler;
