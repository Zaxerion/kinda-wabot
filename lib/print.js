import { WAMessageStubType } from 'baileys';
import urlRegex from 'url-regex-safe';
import { parsePhoneNumber } from 'awesome-phonenumber';
import chalk from 'chalk';
import { watchFile } from 'fs';
import Helper from './helper.js';
import db from './database.js';

const terminalImage = Helper.opts['img'] ? await import('terminal-image') : null;
const urlRegexSafe = urlRegex({ strict: false });

class MessageLogger {
    constructor(conn = { user: {} }) {
        this.conn = conn;
    }

    async formatSender(senderId) {
        const name = await this.conn.getName(senderId);
        const phoneNumber = parsePhoneNumber('+' + senderId.replace('@s.whatsapp.net', ''));
        const internationalNumber = phoneNumber?.number?.international || '';
        return internationalNumber + (name ? ' ~' + name : '');
    }

    getFileSize(message) {
        if (!message.msg) return message.text ? message.text.length : 0;

        const { msg } = message;
        
        if (msg.vcard) return msg.vcard.length;
        if (msg.fileLength) return msg.fileLength.low || msg.fileLength;
        if (msg.axolotlSenderKeyDistributionMessage) return msg.axolotlSenderKeyDistributionMessage.length;
        if (message.text) return message.text.length;
        
        return 0;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return { size: 0, unit: '' };
        
        const units = ['', 'K', 'M', 'G', 'T', 'P'];
        const exponent = Math.floor(Math.log(bytes) / Math.log(1000));
        const size = (bytes / Math.pow(1000, exponent)).toFixed(1);
        const unit = units[exponent] || '';
        
        return { size, unit };
    }

    async getTerminalImage(message) {
        if (!Helper.opts['img']) return null;
        
        try {
            if (/sticker|image/gi.test(message.mtype)) {
                return await terminalImage.buffer(await message.download());
            }
        } catch (error) {
            console.error('Failed to process image:', error);
        }
        
        return null;
    }

    formatMarkdownText(text, depth = 4) {
        const mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g;
        
        const mdFormat = (currentDepth) => (_, type, text, monospace) => {
            const types = {
                '_': 'italic',
                '*': 'bold',
                '~': 'strikethrough'
            };
            
            const content = text || monospace;
            
            if (!types[type] || currentDepth < 1) {
                return content;
            }
            
            return chalk[types[type]](content.replace(mdRegex, mdFormat(currentDepth - 1)));
        };

        return text.replace(mdRegex, mdFormat(depth));
    }

    async processMessageText(message) {
        if (typeof message.text !== 'string' || !message.text) return;

        let log = message.text.replace(/\u200e+/g, '');
        
        if (log.length < 4096) {
            log = log.replace(urlRegexSafe, (url, i, text) => {
                const end = url.length + i;
                const isIsolated = i === 0 || end === text.length || 
                                 (/^\s$/.test(text[end]) && /^\s$/.test(text[i - 1]));
                return isIsolated ? chalk.blueBright(url) : url;
            });
        }

        log = this.formatMarkdownText(log);

        if (message.mentionedJid) {
            for (const user of message.mentionedJid) {
                const userName = await this.conn.getName(user);
                log = log.replace('@' + user.split('@')[0], chalk.blueBright('@' + userName));
            }
        }

        if (message.error != null) {
            console.log(chalk.red(log));
        } else if (message.isCommand) {
            console.log(chalk.yellow(log));
        } else {
            console.log(log);
        }
    }

    logMessageDetails(message) {
        if (message.messageStubParameters) {
            const formattedJids = message.messageStubParameters.map(jid => {
                const decodedJid = this.conn.decodeJid(jid);
                const name = this.conn.getName(decodedJid);
                const phoneNumber = parsePhoneNumber('+' + decodedJid.replace('@s.whatsapp.net', ''));
                const internationalNumber = phoneNumber?.number?.international || '';
                return chalk.gray(internationalNumber + (name ? ' ~' + name : ''));
            });
            console.log(formattedJids.join(', '));
        }
        this.logMediaInfo(message);
    }

    logMediaInfo(message) {
        const { mtype, msg } = message;

        if (/document/i.test(mtype)) {
            console.log(`📄 ${msg.filename || msg.displayName || 'Document'}`);
        } else if (/ContactsArray/i.test(mtype)) {
            console.log(`👨‍👩‍👧‍👦 ${' ' || ''}`);
        } else if (/contact/i.test(mtype)) {
            console.log(`👨 ${msg.displayName || ''}`);
        } else if (/audio/i.test(mtype)) {
            this.logAudioInfo(message);
        }
    }

    logAudioInfo(message) {
        const duration = message.msg.seconds;
        const minutes = Math.floor(duration / 60).toString().padStart(2, '0');
        const seconds = (duration % 60).toString().padStart(2, '0');
        const type = message.msg.ptt ? '🎤 (PTT ' : '🎵 (';
        
        console.log(`${type}AUDIO) ${minutes}:${seconds}`);
    }

    async log(message) {
        const sender = await this.formatSender(message.sender);
        const chat = await this.conn.getName(message.chat);
        const img = await this.getTerminalImage(message);
        
        const filesize = this.getFileSize(message);
        const formattedSize = this.formatFileSize(filesize);
        
        const me = parsePhoneNumber('+' + (this.conn.user?.jid || this.conn.user?.id)?.replace('@s.whatsapp.net', '') || '')?.number?.international || '';
        const timestamp = message.messageTimestamp ? 
            new Date(1000 * (message.messageTimestamp.low || message.messageTimestamp)) : 
            new Date();
        
        const messageType = message.mtype ? 
            message.mtype
                .replace(/message$/i, '')
                .replace('audio', message.msg.ptt ? 'PTT' : 'audio')
                .replace(/^./, v => v.toUpperCase()) : 
            '';

        console.log(`▣────────────···
│ ${chalk.redBright('%s')}
│⏰ㅤ${chalk.black(chalk.bgYellow('%s'))}
│📑ㅤ${chalk.black(chalk.bgGreen('%s'))}
│📊ㅤ${chalk.magenta('%s [%s %sB]')}
│📤ㅤ${chalk.green('%s')}
│📥ㅤ${chalk.green('%s')}
│💬ㅤ${chalk.black(chalk.bgYellow('%s'))}
▣────────────···
`.trim(),
            me + ' ~' + this.conn.user.name,
            timestamp.toTimeString(),
            message.messageStubType ? WAMessageStubType[message.messageStubType] : '',
            filesize,
            formattedSize.size,
            formattedSize.unit,
            sender,
            message.chat + (chat ? ' ~' + chat : ''),
            messageType
        );

        if (img) console.log(img.trimEnd());
        
        await this.processMessageText(message);
        this.logMessageDetails(message);
        console.log();
    }
}

export default async function (m, conn = { user: {} }) {
    const logger = new MessageLogger(conn);
    await logger.log(m);
}

const file = Helper.__filename(import.meta.url);
watchFile(file, () => {
    console.log(chalk.redBright("Update 'lib/print.js'"));
});