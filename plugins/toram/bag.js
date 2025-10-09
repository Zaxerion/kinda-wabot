import axios from 'axios';
import data from './data/bag.js'; 

let handler = async (m, { text }) => {
    const input = (text || '').trim().toLowerCase();

    try {
        if (input === '') {
            const fileList = bagList.map(line => `- ${line}`).join('\n');
            await m.reply(`berikut bahasa yang tersedia:\n${fileList}\n-- contoh .upbag id --`);
        } else {
            let fileName = input.endsWith('.txt') ? input.slice(0, -4) : input;

            const response = await axios.get(global.API("zax", "/api/toram/bag", { lang: fileName }, "apikey"));
            const textData = response.data.data;

            await m.reply(textData);
        }
    } catch (error) {
        console.error("Error fetching or sending text:", error);

        if (error.response && error.response.data.status === 404) {
            const fileList = bagList.map(line => `- ${line}`).join('\n');
            await m.reply(`bahasa ${input} tidak ditemukan, berikut bahasa yang tersedia:\n${fileList}\n-- contoh: .upbag id --`);
        } else {
            await m.reply("Terjadi kesalahan saat mengambil dan mengirim teks.");
        }
    }
}

handler.command = /^upbag$/i;
handler.menutoram = ['upbag <id/en>'];
handler.tagstoram = ['itram'];

handler.help = ['upbag <id/en>'];
handler.tags = ['tram'];

export default handler;
