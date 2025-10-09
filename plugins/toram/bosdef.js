import axios from 'axios';


let handler = async (m, { text, usedPrefix, command }) => {
  const input = text.trim().toLowerCase();
  if (input.length < 3) {
    return m.reply(`Minimal 3 huruf. Contoh: ${usedPrefix + command} colon`);
  }

  try {
    const response = await axios.get(global.API("zax", "/api/toram/boss", { text }, "apikey"));

    const result = response.data.data
    const { bosses, minibosses } = result;

    const hasBoss = bosses?.length;
    const hasMini = minibosses?.length;

    if (hasBoss === 1 && !hasMini) {
      return m.reply(formatStats(bosses[0]));
    }

    if (hasMini === 1 && !hasBoss) {
      return m.reply(formatStats(minibosses[0]));
    }

    if (hasBoss === 1 && hasMini === 1) {
      return m.reply(`${formatStats(bosses[0])}\n\n${formatStats(minibosses[0])}`);
    }

    if ((hasBoss ?? 0) + (hasMini ?? 0) > 0) {
      let msg = `Terdapat lebih dari 1 hasil.\nPersempit pencarian atau ketik nama lengkap:\n`;

      if (hasBoss) {
        msg += `\nBoss:\n- ` + bosses.map(b => `${b.name} / ${b.name_en}`).join('\n- ');
      }

      if (hasMini) {
        msg += `\n\nMiniboss:\n- ` + minibosses.map(b => `${b.name} / ${b.name_en}`).join('\n- ');
      }

      return m.reply(msg);
    }
  } catch (err) {
    console.log(err)
      const msg = err?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
      m.reply(msg);
  }
};

handler.command = /^(bosdef|bossdef)$/i;
handler.help = ['bosdef <nama>'];
handler.tags = ['tram'];
handler.menutoram = ['bosdef <nama>'];
handler.tagstoram = ['tram'];


export default handler;


function formatStats(mob) {
  const { name, name_en, map, map_en, element, ele_en, stats } = mob;

  return (
    `*${name} / ${name_en}*

Map:
- ${map}
- ${map_en}

Element:
- ${element} (${ele_en})

Physical Defense:
- ${stats.pdef}

Magical Defense:
- ${stats.mdef}

Physical Resistance:
- ${stats.pres}

Magical Resistance:
- ${stats.mres}

Critical Resistance:
- ${stats.crres}

Flee:
- ${stats.flee}

Neutral Proration:
- ${stats.nprorate}

Physical Proration:
- ${stats.pprorate}

Magical Proration:
- ${stats.mprorate}

Retaliation:
${stats.Retaliation}


EASY = 0.1 * def | flee
HARD = 2 x def | flee
NIGHTMARE = 4 x def | flee
ULTIMATE = 6 x def | flee.`
  );
}