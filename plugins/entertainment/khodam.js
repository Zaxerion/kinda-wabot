import axios from 'axios';

let handler = async (m, { conn, text }) => {
    let targetJid = m.sender;
    let mentionText = '@' + targetJid.split('@')[0];

    if (targetJid) {
        try {
            const response = await axios.get(global.API("zax", "/api/etc/khodam", { text: targetJid.split('@')[0] }, "apikey"));

            conn.reply(
                m.chat,
                `Khodam ${mentionText} hari ini adalah...\n\n*${response.data.data}*`,
                m,
                { mentions: [targetJid] }
            );
        } catch (error) {
            console.error("Error getting API content:", error);
            await m.reply("Mandi dulu kak kalo mau cek khodam 😓.");
        }
    } else {
        await m.reply("Masukkan nama kakak setelah command.");
    }
};

handler.menufun = ['khodam <nama>'];
handler.tagsfun = ['gacha'];

handler.help = ['khodam'];
handler.tags = ['Menu Fun'];

handler.command = /^khodam$/i;

export default handler;
