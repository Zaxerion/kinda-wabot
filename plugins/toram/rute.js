import axios from 'axios';

let handler = async (m, { text }) => {
    const query = text?.trim();

    if (!query || query.length < 3) {
        return m.reply("Masukan sebagian nama xtall (minimal 3 huruf).");
    }

    try {
        const { data } = await axios.get(global.API("zax", "/api/toram/rute", { text }, "apikey"));

        if (!data.success || !data.data) {
            return m.reply("Xtall tidak ditemukan.");
        }

        const groupedPaths = data.data;
        let response = '';
        const unique = new Set();

        for (const [type, entries] of Object.entries(groupedPaths)) {
            if (!entries || entries.length === 0) continue;

            response += `──────────────────\n*${type}*\n`;

            for (const { id, en } of entries) {
                const key = `${id}|${en}`;
                if (!unique.has(key)) {
                    response += `- ${id}\n- ${en}\n\n`;
                    unique.add(key);
                }
            }
        }

        m.reply(response.trim() + '\n\n──────────────────' || 'Tidak ada rute ditemukan.');

    } catch (error) {
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};

handler.command = /^rute$/i;
handler.help = ['rute <nama xtall>'];
handler.tags = ['tram'];
handler.menutoram = ['rute <nama xtall>'];
handler.tagstoram = ['tram'];

export default handler;
