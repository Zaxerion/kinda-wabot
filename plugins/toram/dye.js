import axios from 'axios'; 

let handler = async (m, { conn, text }) => {
    if (text) return

    const chatId = m.key.remoteJid;
    const imageUrl = "https://raw.githubusercontent.com/dayoyui/dbs/refs/heads/main/toram/dye.png";
    try {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const currentMonth = months[new Date().getMonth()];
        const currentYear = new Date().getFullYear();

        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');

        const messageOptions = {
            caption: `Prediksi dye Bulan ${currentMonth} ${currentYear}\nSumber:\u00A0https://tanaka0.work/AIO/en/DyePredictor/ColorWeapon`,
        };

        await conn.sendMessage(chatId, { image: imageBuffer, ...messageOptions });
    } catch (error) {
        console.error("Error sending dye image:", error);
        await conn.sendMessage(chatId, { text: "Terjadi kesalahan saat mengirim gambar dye." });
    }
}

handler.command = /^dye$/i;
handler.menutoram = ['dye']
handler.tagstoram = ['itram']


handler.help = ['dye']
handler.tags = ['tram']

export default handler;


/**
 
                const response = await axios.get(gambar, { responseType: 'arraybuffer' });
                const imageBuffer = Buffer.from(response.data, 'binary');

                await conn.sendMessage(m.chat, { image: imageBuffer });
 */