import axios from 'axios';

let handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply('Gunakan perintah:\n`.adv <lvl> <persen>% bab <mulai>`\nContoh:\n.adv 20 40% bab 6');
  }

  try {
    const response = await axios.get(global.API("zax", "/api/toram/adv", { text }, "apikey"));

    const json = await response.data;

    const { lastmq, data } = json;

    let message = `MQ Terbaru\n${lastmq}\n──────────────────\n`;

    if (typeof data === 'string') {
      message += data;
    } else if (typeof data === 'object') {
      if (data.skipPreVenena) message += `Skip Pre-Venena Metacoenubia\n${data.skipPreVenena}\n`;
      if (data.fightPreVenena) message += `\nFight Pre-Venena Metacoenubia\n${data.fightPreVenena}`;
    }

    await conn.sendMessage(m.chat, { text: message.trim() }, { quoted: m });

  } catch (err) {
      const msg = err?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
      m.reply(msg);
  }
};


handler.command = /^adv$/i;
handler.menutoram = ['adv']
handler.tagstoram = ['sram']

handler.help = ['adv']
handler.tags = ['tram']

export default handler;
