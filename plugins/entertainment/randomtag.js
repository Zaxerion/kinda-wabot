let handler = async (m, { conn, participants }) => {
    let randomMember = participants[Math.floor(Math.random() * participants.length)];
    let randomId = randomMember.id;
    
    let teks = `Hasil random tag:\n@${randomId.split('@')[0]}`;
    
    await m.reply( teks, null, { mentions: [randomId] });
};

handler.menugroup = ['randomtag'];
handler.tagsgroup = ['entertainment'];
handler.command = /^(randomtag)$/i;

handler.help = ['randomtag'];
handler.tags = ['Menu Fun'];

handler.admin = true;
handler.group = true;

export default handler;