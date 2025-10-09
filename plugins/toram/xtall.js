import axios from 'axios';

let handler = async (m, { text }) => {
    const itemName = text.trim();
    if (!itemName || itemName.length < 3) {
        return m.reply('Masukkan minimal 3 huruf dari nama xtall yang ingin dicari.\nContoh: .xtall fal');
    }

    try {
        const { data } = await axios.get(global.API("zax", "/api/toram/xtall", { text }, "apikey"));

        if (!data.success || !data.data || data.data.length === 0) {
            return m.reply("Xtall tidak ditemukan. Periksa kembali input Anda, masukkan minimal 3 huruf dari nama xtall yang ingin dicari.");
        }

        let resultMessage = data.data.map(c => {
            let routesStr = (c.routes && c.routes.length > 0) 
                ? c.routes.map(r => `- ${r.id}\n- ${r.en}`).join("\n\n")
                : "- (tidak ada rute)";

            return `${c.name_id} / ${c.name_en} (${c.type})\n\n${c.view}\n\n${routesStr}`;
        }).join(`\n\n──────────────────\n\n`);

        m.reply("──────────────────\n\n" + resultMessage + "\n\n──────────────────");
    } catch (error) {
        console.log(error)
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        m.reply(msg);
    }
};

handler.command = /^xtall$/i;
handler.menutoram = ['xtall <nama xtall>'];
handler.tagstoram = ['tram'];

handler.help = ['xtall <nama xtall>'];
handler.tags = ['tram'];

export default handler;