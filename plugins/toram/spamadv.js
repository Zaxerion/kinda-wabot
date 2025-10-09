import axios from 'axios';

let handler = async (m, { text }) => {
    if (!text) {
        m.reply('Gunakan perintah:\n.spamadv `lvl awal` `level persen` `lvl target` `bab mulai`\ncontoh:\n.spamadv 20 40% 280 bab 6');
        return;
    }

    try {
        const response = await axios.get(global.API("zax", "/api/toram/spamadv", { text }, "apikey"));

        const json = response.data;

        if (!json.success || !json.data) {
            m.reply("Gagal mengambil data dari server. Coba lagi nanti.");
            return;
        }

        const { data } = json;
        let message = `MQ Terbaru\n${data.lastmq}\n──────────────────\n`;

        if ('path' in data && 'diariesNeeded' in data) {
            message += data.path.join('\n') + '\n';
            message += `Butuh ${data.diariesNeeded} Adventure Diary untuk ke Lv.${data.targetLevel}`;
        } else {
            if (data.skipPreVenena) {
                message += `Skip Pre-Venena Metacoenubia\n${data.skipPreVenena.path.join('\n')}\n`;
                message += `Butuh ${data.skipPreVenena.diariesNeeded} Adventure Diary untuk ke Lv.${data.targetLevel}\n`;
            }
            if (data.fightPreVenena) {
                message += `\nFight Pre-Venena Metacoenubia\n${data.fightPreVenena.path.join('\n')}\n`;
                message += `Butuh ${data.fightPreVenena.diariesNeeded} Adventure Diary untuk ke Lv.${data.targetLevel}`;
            }
        }
        await m.reply(message);
    } catch (err) {
        const msg = err?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        m.reply(msg);
    }
};

handler.command = /^spamadv$/i;
handler.menutoram = ['spamadv'];
handler.tagstoram = ['sram'];
handler.help = ['spamadv'];
handler.tags = ['tram'];

export default handler;
