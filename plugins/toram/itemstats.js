import axios from 'axios';

let handler = async (m, { text }) => {
    if (!text) {
         return m.reply(`list stats ketik .liststats
- input dapat berupa stats maupun dengan filter
- operator yang didukung =, >, <
- dapat memfilter berdasarkan type dan element
- value berupa angka positif dan negatif (-10, 12, 1)

contoh:
.itemstats hunus%
.itemstats atk% > 5, type=1h
.itemstats element=fire, type=arrow

element:
- fire, water, wind, earth, light, dark, neutral

type:
- equip = equip, eq
- usable = usable
- bowgun = bowgun, bwg
- knuckles = knuckles, knuk
- magic device = md
- shield = shield
- special = special, ring
- staff = staff
- hakberd = hb, halberd
- katana = katana, ktn
- scroll = scroll
- ohs = ohs, 1h
- ths = ths, 2h
- additional = add, additional
- arrow = arrow
- armor = armor, arm
- bow = bow
`);
    }

    try {
        const { data } = await axios.get(global.API("zax", "/api/toram/itemstats", { text }, "apikey"));

        if (!data.success || !data.data || data.data.length === 0) {
            return m.reply('Item tidak ditemukan, coba cari dengan bahasa Inggris.');
        }

        let allResults = data.data.map(item => {
            let result = '';
            result += `${item.name} ${item.type ?? ''}\n`;
            if (item.stats?.length) {
                for (const stat of item.stats) {
                    result += `- ${stat.name}: ${stat.value}\n`;
                }
            }

            return result;
        });

        m.reply(allResults.join('\n'));
    } catch (error) {
        console.error(error);
        const msg = error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};

handler.command = /^itemstat(s)?$/i;
handler.menutoram = ['itemstat'];
handler.tagstoram = ['tram'];
handler.help = ['itemstat'];
handler.tags = ['tram'];

export default handler;
