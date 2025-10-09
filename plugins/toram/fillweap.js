import axios from 'axios';

let handler = async (m, { text }) => {
    if (!text) {
        return m.reply(`list stats ketik .cheatsheet

maksimal positif dan negatif stats = 7
untuk positif isi dengan angka / max
untuk negatif isi dengan angka / min
dte, rte, elematch dan nonmatch adalah fire, ele lain cek di list
elematch dan nonmatch cukup isi 1

Contoh 
*.fillweap elenon=1, dte%=20, cd=max, atk%=10, cr=max, hpreg=min, dodge=min, def%=min, pot=113, prof=260*`);
    }
    try {
        const response = await axios.get(global.API("zax", "/api/toram/fillweap", { q: text }, "apikey"));
        const res = response.data.data
        m.reply(res, null, { linkPreview: false });
    } catch (error) {
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};

handler.command = /^fillweap$/i;
handler.menutoram = ['fillweap'];
handler.tagstoram = ['sram'];
handler.help = ['fillweap'];
handler.tags = ['tram'];

export default handler;
