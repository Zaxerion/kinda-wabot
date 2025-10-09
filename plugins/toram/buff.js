import axios from 'axios';
import buffList from './data/buff.js'; 

let handler = async (m, { text }) => {
    let input = (text || '').trim().toLowerCase();
    let result;

    if (!input) input = 'all';

    try {
        const response = await axios.get(global.API("zax", "/api/toram/buff", { text: input }, "apikey"));
        const res = response.data;

        if (input === 'all') {
            if (res.success && Array.isArray(res.data)) {
                result = res.data.map(item => `${item.data}`).join('\n──────────────────\n');
            } else {
                throw new Error('Format data tidak sesuai.');
            }
        } else {
            if (res.success && res.data) {
                result = res.data;
            } else {
                throw new Error('Data tidak ditemukan.');
            }
        }

        await m.reply(result);
    } catch (error) {
        console.error('Error saat mengambil data buff:', error.message);

        const fallback = buffList.map(line => `- ${line}`).join('\n');
        await m.reply(`Buff '${input}' tidak ditemukan.\nBerikut buff yang tersedia:\n${fallback}\n-- contoh: .buff ampr --`);
    }
};

handler.command = /^buff$/i;
handler.menutoram = ['buff'];
handler.tagstoram = ['itram'];

handler.help = ['buff'];
handler.tags = ['tram'];

export default handler;

