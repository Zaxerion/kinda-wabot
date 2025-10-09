import axios from 'axios';

let handler = async (m, { text }) => {
    const itemName = text.trim();

    if (!itemName || itemName.length < 3) {
        return m.reply(` list stats ketik .liststats
input dapat berupa stats maupun dengan filter
operator yang didukung =, >, <
value berupa angka positif dan negatif (-10, 12, 1)

contoh:
.xtallstats hunus%
.xtallstats atk% > 5
.xtallstats mp = -100
.xtallstats atk% < -1
`);

    }

    try {
        const { data } = await axios.get(global.API("zax", "/api/toram/fstall", { text: itemName }, "apikey"));

        if (!data.success || !data.data || data.data.length === 0) {
            return m.reply("Xtall dengan stats yang dicari tidak ditemukan. Periksa kembali input Anda.");
        }

        let resultMessage = data.data.map(c => {
            return `󠁯${c.name_id} / ${c.name_en}\n- ${c.stat} ${c.value}`;
        }).join(`\n\n`);

        m.reply(resultMessage);
    } catch (error) {
        console.log(error)
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        m.reply(msg);
    }
};

handler.command = /^xtal(l)?stat(s)?$/i;
handler.menutoram = ['xtallstats'];
handler.tagstoram = ['stram'];

handler.help = ['xtallstats'];
handler.tags = ['tram'];

export default handler;
