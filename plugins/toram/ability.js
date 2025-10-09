import axios from 'axios';

let handler = async (m, { text, command, usedPrefix }) => {
    const searchQuery = text.trim().toLowerCase();

    if (searchQuery.length < 3) {
        await m.reply(`Masukkan minimal 3 huruf, dapat juga mencari tier.
Contoh: ${usedPrefix + command} bunker / ${usedPrefix + command} tier 3
            
Note:
- Activation Power X akan terisi sampai 100, lalu efek Ability langsung aktif. Setelah itu kembali ke 0 dan mengisi lagi dari awal.
- Tier 5 Hanya drop dari boss dengan base lvl 200+ dan diff ultimate (mulai dari boss hexter keatas)
- Sub Weapon tidak akan memicu efek Ability
- Jika Ability yang sama dipasang di senjata dan armor, dua-duanya akan aktif
- Ability hanya bisa ditransfer untuk senjata sejenis
- Peluang dasar transfer = 10% + Radiant Chance. Kalau senjata punya nama sama (misalnya 10th Anniv KTN VI → 10th Anniv KTN VI), langsung jadi 100%.
- Ability bertipe damage taken bisa dipicu dengan menginjak trap buatan sendiri
- Setiap stak bertambah +1 bahkan sampai maksimal akan mereset durasi, jika durasi habis semua stak hilang
- Skill multi-hit atau auto attack hanya memberi +1 stack
- Semua serangan pasif termasuk dari skill (Asura Punch, Decoy Shot, dan Shadow Walk) tidak menambah stak
- hanya MISS asli yang dihitung. MISS yang sengaja dibuat tidak dihitung. MISS dari Clone juga tidak dihitung.
- Transfer Ability tidak menghapus gear asalnya
- Kalau transfer gagal, Ability hilang dan diganti jadi Radiant Chance
- Magic Hammer menurunkan persentase sukses -10%, Super Magic Hammer -30%, Hyper Magic Hammer -70%, Bisa ditumpuk sampai sukses rate 0%.
- Magic Hammer juga berpengaruh pada kenaikan level Radiant Chance (Super Magic Hammer +1, Hyper Magic Hammer/Orb +2), Hammer dengan tier berbeda akan dipilih secara acak.
- Menggabung 2 gear dengan Radiant Chance, hanya angka tertinggi yang dipakai, lalu dinaikkan levelnya
- Auto discard akan membuang eq yang memiliki ability

Tier:
- ⚪ : Tier I
- 🟢 : Tier II
- 🔵 : Tier III
- 🟣 : Tier IV
- 🟠 : Tier V
`); return }

    try {
        const res = await axios.get(global.API("zax", "/api/toram/ability", { text: text }, "apikey"));

        const data = res.data.result;

        const filtered = data.filter(item =>
            (item.name_id && item.name_id.toLowerCase().includes(searchQuery)) ||
            (item.name_en && item.name_en.toLowerCase().includes(searchQuery))
        );

        if (data.length === 0) {
            await m.reply(`Ability ${searchQuery} tidak ditemukan dalam daftar.`);
            return;
        }

        let message = '';

        if (/^tier\s+\d+$/i.test(searchQuery)) {
            for (const item of data) {
                message += `- ${item.name_id || '-'} / ${item.name_en || '-'}\n`;
            }
        }
        else {
            message = 'Notes :\n- Value `x` sesuai tier\n- Data belum 100% lengkap\n\n──────────────────\n\n';
            for (const item of filtered) {
                message += `*${item.name_id || '-'} / ${item.name_en || '-'}*\n\n`;

                if (item.desc_id) {
                    const lines = item.desc_id.split('\n');
                    const formatted = lines
                        .map(line => `- ${line}`) // SEMUA baris pakai dash
                        .join('\n');
                    message += `Desc :\n${formatted}\n\n`;
                } else {
                    message += `Desc :\n-\n\n`;
                }

                if (item.tier && item.tier.length > 0) {
                    for (const t of item.tier) {
                        message += `Tier ${t.tier}:\n- ${t.value}\n`;
                    }
                }

                message += `\n──────────────────\n\n`;
            }

        }

        await m.reply(message.trim());
    } catch (err) {
        const msg = err?.response?.data?.message || 'Terjadi kesalahan saat mengambil data dari API.';
        await m.reply(msg);
    }
};

handler.command = /^ability|trait$/i;
handler.menutoram = ['ability <nama>'];
handler.tagstoram = ['tram'];
handler.help = ['ability <nama>'];
handler.tags = ['tram'];

export default handler;