import axios from 'axios';

let handler = async (m, { text }) => {
    if (!text) {
        return m.reply('Masukkan monster yang ingin dicari setelah command\nContoh: .mobs Colon');
    }

    try {
        const { data } = await axios.get(global.API("zax", "/api/toram/mobs", { text }, "apikey"));

        if (!data.success || !data.data || data.data.length === 0) {
            return m.reply('Monster tidak ditemukan, coba pakai nama lain.');
        }

        const allResults = data.data.map(mob => {
            let result = '──────────────────\n';
            result += `\n*${mob.name} (Lv ${mob.level})*`;
            if (mob.hp) result += `\nHP: ${mob.hp}`;
            if (mob.exp) result += `\nExp: ${mob.exp}`;
            if (mob.type && mob.type !== '-') result += `\nType: ${mob.type}`;
            if (mob.element) result += `\nElement: ${mob.element}`;
            if (mob.tamable) result += `\nTamable: ${mob.tamable}`;

            if (mob.spawn_at?.length) {
                result += `\n\nSpawn at:\n`;
                mob.spawn_at.forEach(loc => result += `- ${loc}\n`);
            }

            if (mob.drops?.length) {
                result += `\nItem Drops:\n`;
                mob.drops.forEach(drop => {
                    result += `- ${drop.name}${drop.type ? ` (${drop.type})` : ''}\n`;
                });
            }
            
            return result;
        });

        m.reply(allResults.join('\n') + '\n──────────────────');

    } catch (error) {
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};

handler.command = /^mob(s)?$/i;
handler.menutoram = ['mobs'];
handler.tagstoram = ['tram'];
handler.help = ['mobs'];
handler.tags = ['tram'];

export default handler;