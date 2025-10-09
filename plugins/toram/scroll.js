import axios from 'axios';

const inisial = {
    '1h': '1', '2h': '2', 'bow': '3', 'bwg': '4',
    'ktn': '5', 'hb': '6', 'stf': '7', 'md': '8', 'knx': '9'
};

function convertToCode(initials) {
    return initials.split(',').map(initial => {
        const trimmed = initial.trim().toLowerCase();
        return inisial[trimmed] || trimmed;
    }).join(',');
}

let handler = async (m, { text }) => {
    if (!text) {
        return m.reply("`.scroll` `1h,2h,hb`\n\nTipe weapon:\n1h\n2h\nbow\nbwg\nktn\nhb\nstf\nmd\nknx");
    }

    const input = convertToCode(text.trim());

    try {
        const { data } = await axios.get(global.API("zax", "/api/toram/scroll", { text }, "apikey"));

        if (!data.success || !data.data || data.data.length === 0) {
            return m.reply("Scroll tidak ditemukan, periksa kembali kombinasi weapon.");
        }

        let resultText = '';
        for (const scroll of data.data) {
            resultText += `Senjata: ${scroll.weapons}\n`;
            resultText += `Tipe Scroll: ${scroll.scrollTypes}\n`;
            resultText += `Skills: ${scroll.skills}\n\n`;
        }

        m.reply(resultText.trim());
    } catch (error) {
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};

handler.command = /^scroll$/i;
handler.menutoram = ['scroll'];
handler.tagstoram = ['sram'];
handler.help = ['scroll'];
handler.tags = ['tram'];

export default handler;
