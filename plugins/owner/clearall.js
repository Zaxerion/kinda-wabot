import db from '../../lib/database.js';
import { readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

let handler = async (m, { conn, usedPrefix, command }) => {
/*
    let deletedGroupsCount = 0;
    let deletedUsersCount = 0;

    for (let x of Object.keys(db.data.chats)) {
        if (db.data.chats[x].isPremium === false) {
            delete db.data.chats[x];
            deletedGroupsCount++;
        }
    }

    

    for (let x of Object.keys(db.data.users)) {
        if (db.data.users[x].permaban === false && db.data.users[x].expired === 0) {
            delete db.data.users[x];
            deletedUsersCount++;
        }
    } */

    await m.reply(`Done`);
};

handler.menuowner = ['clearall'];
handler.tagsowner = ['owner'];
handler.command = /^(clearall)$/i;

handler.owner = true;

//export default handler;