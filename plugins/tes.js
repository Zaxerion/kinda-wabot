
import db, { loadDatabase } from './../lib/database.js'

const handler = async (m, { conn, text, groupMetadata, participants, isAdmin }) => {
    //let nohp = m.quoted ? m.quoted.sender : m.mentionedJid ? m.mentionedJid[0] : ''
    const user =  participants.find(p => p.phoneNumber === m.sender || p.id === m.sender)
    console.log(user)
    const admin = user?.admin === 'admin'
    //await m.reply(`Sender : ${m.sender}\n\nAdmin : ${admin}\nisAdmin : ${isAdmin}\n\n\nMetadata : ${JSON.stringify(user, null, 2)}`)

    await conn.sendMessage(m.key.remoteJid, { text: `Sender : ${m.sender}\n\nAdmin : ${admin}\nisAdmin : ${isAdmin}\n\n\nMetadata : ${JSON.stringify(user, null, 2)}` });
   // console.log(groupMetadata)
    /*
    try {
         if (text && !text.startsWith ('@')) {
             console.log('Checking text...');
             input = text.replace(/[@ .+-]/g, '');
             source = 'text';
         } else if (m.quoted) {
             console.log('Checking m.quoted:', m.quoted);
             if (!m.quoted.sender) throw new Error('m.quoted.sender is undefined');
             input = m.quoted.sender;
             source = 'm.quoted.sender';
         } else if (m.mentionedJid && m.mentionedJid.length > 0) {
             console.log('Checking m.mentionedJid:', m.mentionedJid);
             if (!m.mentionedJid[0]) throw new Error('m.mentionedJid[0] is undefined');
             input = m.mentionedJid[0];
             source = 'm.mentionedJid[0]';
         } else {
             console.log('Checking m.sender:', m.sender);
             if (!m.sender) throw new Error('m.sender is undefined');
             input = m.sender;
             source = 'm.sender';
         }
 
         console.log('Input diambil dari:', source);
         console.log('Nilai input:', input);
     } catch (error) {
         console.error('Error di bagian:', source || 'belum diketahui');
         console.error(error);
         // Kamu bisa throw ulang atau tangani errornya sesuai kebutuhan
     }
    */
};

handler.command = /^tess$/i;
//handler.owner = true;

export default handler;
