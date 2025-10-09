import path from 'path';
import fs from 'fs';

let handler = async (m, { conn, text }) => {
  const chatId = m.key.remoteJid;
  let chatt = m.chat.endsWith('@g.us')
  const imagePath = path.resolve('data/qris.png');
  const imageBuffer = fs.readFileSync(imagePath)
  let adt = ""

  if (!chatt) {
    adt = "\n\n*ID DIATAS ADALAH ID PRIBADI*,\nGunakan .donate di grup untuk mendapatkan ID grup jika ingin donate untuk grup."
  }

  const messageOptions = {
    caption: `Donasi minimal 5K/15M spina untuk menghilangan jeda, mengakses fitur donator dan AI Chat Kinda selama sebulan.\nSetelah donasi bisa menguhubungi owner dan memberikan ID \n\nWA : 085157571221\nID : ${m.chat}${adt}`,
  };

  try {    
  await conn.sendMessage(chatId, { image: imageBuffer, ...messageOptions });
  
	//if (data.length > 0) await conn.sendContact(m.chat, data.map(([id, name]) => [id, name]), m)
  } catch (error) {
    console.error("Error sending dye image:", error);
    await m.reply("Terjadi kesalahan saat mengirim gambar.");
  }
}


handler.command = /^donate$/i;
handler.help = ['donate']
handler.tags = ['information']

export default handler;