import axios from 'axios';
import matsList from './data/mats.js'; 

let handler = async (m, { text }) => {
    const input = (text || '').trim().toLowerCase();

    try {
        if (input === '') {
            const fileList = matsList.map(line => `- ${line}`).join('\n');
            await m.reply(`Daftar mats:\n${fileList}\n-- contoh: .mats fauna --`);
        } else {
            const response = await axios.get(global.API("zax", "/api/toram/mats", { text: input }, "apikey"));
            const data = response.data;

            if (data.success && data.data) {
                const indo = data.data.map(monster => {
                    const line = `${monster.name_id} (${monster.location_id}) (${monster.level}-${monster.element_id})`;
                    const drops = monster.drops_id.map(drop => `- ${drop}`).join('\n');
                    return `${line}\n${drops}`;
                }).join('\n\n');

                const eng = data.data.map(monster => {
                    const line = `${monster.name_en} (${monster.location_en}) (${monster.level}-${monster.element_en})`;
                    const drops = monster.drops_en.map(drop => `- ${drop}`).join('\n');
                    return `${line}\n${drops}`;
                }).join('\n\n');

                const fullMessage = `${indo}\n──────────────────\n${eng}`;
                await m.reply(fullMessage);
            } else {
                throw new Error('Data tidak ditemukan atau format tidak sesuai.');
            }
        }
    } catch (error) {
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};

handler.command = /^mats$/i;
handler.menutoram = ['mats'];
handler.tagstoram = ['itram'];
handler.help = ['mats'];
handler.tags = ['tram'];

export default handler;
