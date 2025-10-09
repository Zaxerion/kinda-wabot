import axios from 'axios';

let handler = async (m, { text }) => {
    if (!text) {
        return m.reply('Masukkan nama item setelah command\nContoh: .item dango');
    }

    try {
        const { data } = await axios.get(global.API("zax", "/api/toram/item", { text }, "apikey"));

        if (!data.success || !data.data || data.data.length === 0) {
            return m.reply('Item tidak ditemukan, coba cari dengan bahasa Inggris.');
        }

        let allResults = data.data.map(item => {
            let result = '──────────────────\n';
            result += `\n*${item.name}* ${item.type ?? ''}`;
            if (item.sell) result += `\nSell: ${item.sell}`;
            if (item.process) result += `\nProcess: ${item.process}\n`;
            if (item.duration) result += `Duration: ${item.duration}\n`;

            if (item.stats?.length) {
                result += '\nStats/Effect:\n';
                for (const stat of item.stats) {
                    result += `- ${stat.name}: ${stat.value}\n`;
                }
            }

            if (item.obtained_from?.length) {
                result += '\nObtained From:\n';
                for (const src of item.obtained_from) {
                    result += `- ${src.monster} (${src.level}) : ${src.map}\n`;
                }
            }

            if (item.used_for?.length) {
                result += '\nUsed For:\n';
                for (const use of item.used_for) {
                    result += `- ${use}\n`;
                }
            }

            if (item.recipe) {
                result += '\nRecipe:\n';
                result += `Fee: ${item.recipe.fee}\n`;
                result += `Set: ${item.recipe.set}\n`;
                result += `Level: ${item.recipe.level}\n`;
                result += `Difficulty: ${item.recipe.difficulty}\n`;
                if (item.recipe.materials?.length) {
                    result += `Materials:\n`;
                    for (const mat of item.recipe.materials) {
                        result += `${mat}\n`;
                    }
                }
            }

            return result;
        });

        m.reply(allResults.join('\n') + '\n──────────────────');
    } catch (error) {
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};

handler.command = /^item(s)?$/i;
handler.menutoram = ['item'];
handler.tagstoram = ['tram'];
handler.help = ['item'];
handler.tags = ['tram'];

export default handler;
