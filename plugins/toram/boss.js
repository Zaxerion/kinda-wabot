import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const query = text.trim();

  if (!query) return m.reply(`Gunakan untuk mencari boss/mini boss & memfilter tingkat kesulitan.\nContoh: .boss don / .boss don nm\n\n`);

  if (query.length < 3) return m.reply('Minimal 3 huruf. Contoh: .boss don');

  try {
    const response = await axios.get(global.API("zax", "/api/toram/boss", { text }, "apikey"));
    const { bosses, minibosses } = response.data.data;

    if (bosses.length === 0 && minibosses.length === 0)
      return m.reply('Boss/mini boss tidak ditemukan atau belum ditambahkan.');

    const messages = [];

    for (const item of bosses) {
      const result = formatBossEntry(item);
      if (result) messages.push(result);
    }

    for (const item of minibosses) {
      const result = formatMiniEntry(item);
      if (result) messages.push(result);
    }

    if (messages.length === 0) return m.reply('Tidak ada hasil sesuai tingkat kesulitan yang diminta.');

    await m.reply('Tips: gunakan \'.bossdef nama_boss\' untuk melihat detail lengkap\n' + messages.join('') + '\n──────────────────');
  } catch (err) {
    console.error(err);
    const msg = err?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
    await m.reply(msg);
  }
};

handler.command = /^boss$/i;
handler.menutoram = ['boss <nama>'];
handler.tagstoram = ['tram'];
handler.help = ['boss <nama>'];
handler.tags = ['tram'];

export default handler;


function formatBossEntry(item, diff) {
  let result = '';

  let difficulties = item.difficulties || [];
  if (diff) {
    difficulties = difficulties.filter(d => d.diff.toLowerCase() === diff);
    if (difficulties.length === 0) return '';
  }

  const diffDetails = difficulties.map(d =>
    `\n${d.diff}\n- Lv: ${d.lvl}\n- HP: ${d.hp}\n- XP: ${d.xp}`
  ).join('\n');

  result += '\n──────────────────\n\n';
  result += `*${item.name} / ${item.name_en}*\n`;
  result += `- Unsur: ${item.element}\n`;
  result += `- Peta: ${item.map}\n`;
  result += `- Drop: ${item.drops}\n`;
  result += `- Boss Dye: ${item.color}\n`;
  result += `${diffDetails}\n`;

  return result;
}

function formatMiniEntry(item, diff) {
  if (diff && item.diff?.toLowerCase() !== diff) return '';

  return (
    '\n──────────────────\n\n' +
    `*${item.name} / ${item.name_en}*\n- Level: ${item.lvl}\n` +
    `- Unsur: ${item.element}\n` +
    `- HP: ${item.hp}\n` +
    `- XP: ${item.xp}\n` +
    `- Peta: ${item.map}\n` +
    `- Drop: ${item.drops}\n`
  );
}
