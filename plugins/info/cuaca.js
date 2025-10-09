import axios from 'axios';

let handler = async (m, { text }) => {
  if (!text) return m.reply("Masukkan kota/daerah. Contoh: *.cuaca lampung*");
  try {
    const res = await axios.get(global.API("zax", "/api/tools/cuaca", { text }, "apikey"));
    const data = res.data.data;

    if (!data) return m.reply("Data cuaca tidak ditemukan.");

    const city = data.location;
    const current = data.current;

    let txt = `*Cuaca di ${city.name}, ${city.admin1 || ''}*\n\n`
      + `*Update :* ${current.time}\n`
      + `*Suhu :* ${current.temperature}°C\n`
      + `*Terasa Seperti :* ${current.feels_like}°C\n`
      + `*Kondisi :* ${current.condition}\n`
      + `*Kelembapan :* ${current.humidity}%\n`
      + `*UV Index :* ${current.uv_index ?? "N/A"}\n`
      + `*Angin :* ${current.wind_speed} km/jam\n\n`;

    txt += `*Prakiraan 3 Hari ke Depan:*`;
    data.forecast.forEach((hari) => {
      txt += `\n${hari.date}\n`
        + `Max: ${hari.max_temp}°C | Min: ${hari.min_temp}°C\n`
        + `Kondisi: ${hari.condition}\n`;
    });

    m.reply(txt);

  } catch (e) {
    console.error(e);
    m.reply("Terjadi kesalahan saat mengambil data cuaca.");
  }
};

handler.help = ['cuaca <kota>'];
handler.tags = ['information'];
handler.command = /^(cuaca)$/i;

export default handler;
