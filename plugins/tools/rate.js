import axios from 'axios'

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
    if (!text) throw `Contoh:\n*${usedPrefix}${command} USD IDR* \n*${usedPrefix}${command} IDR USD 10000*`;
    
    let dari = args[0]?.toUpperCase();
    let ke = args[1]?.toUpperCase();
    let jumlah = args[2] ? args[2] : "1";

    try {
        const response = await axios.get(global.API("zax", "/api/tools/rate", { from:dari, to:ke, amount:jumlah }, "apikey"));
        const data = response.data.data;

        if (data && data.result != null) {
            const formattedResult = Math.round(data.result).toLocaleString('id-ID'); 
            if (args[2]) {
                m.reply(`${data.amount} ${data.from} sama dengan ${formattedResult} ${data.to}`);
            } else {
                m.reply(`1 ${data.from} sama dengan ${formattedResult} ${data.to}`);
            }
        } else {
            m.reply('Gagal mendapatkan data rate.');
        }
    } catch (error) {
        console.error(error);
        m.reply(`Terjadi kesalahan saat memproses permintaan.`);
    }
};

handler.help = ['rate <from> <to> [jumlah]'];
handler.tags = ['information'];
handler.command = /^(rate)$/i;

export default handler;
