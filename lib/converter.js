import { createReadStream, promises, ReadStream } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { JSDOM } from 'jsdom'
import Helper from './helper.js'
import ffmpeg from 'fluent-ffmpeg';

const __dirname = Helper.__dirname(import.meta.url)

function ffmpegcli(buffer, args = [], ext = '', ext2 = '') {
	return new Promise(async (resolve, reject) => {
		try {
			const tmp = join(__dirname, `../tmp/${Date.now()}.${ext}`)
			const out = `${tmp}.${ext2}`

			const isStream = Helper.isReadableStream(buffer)
			if (isStream) await Helper.saveStreamToFile(buffer, tmp)
			else await promises.writeFile(tmp, buffer)

			spawn('ffmpeg', [
				'-y',
				'-i', tmp,
				...args,
				out
			])
				.once('error', reject)
				.once('close', async (code) => {
					try {
						await promises.unlink(tmp)
						if (code !== 0) return reject(code)
						const data = createReadStream(out)
						resolve({
							data,
							filename: out,
							async toBuffer() {
								const buffers = []
								for await (const chunk of data) buffers.push(chunk)
								return Buffer.concat(buffers)
							},
							async clear() {
								data.destroy()
								await promises.unlink(out)
							}
						})
					} catch (e) {
						reject(e)
					}
				})
		} catch (e) {
			reject(e)
		}
	})
}

function toAudio(buffer, ext) {
	return ffmpegcli(buffer, [
		'-vn',
		'-c:a', 'libopus',
		'-b:a', '128k',
		'-ar', '48000',
		'-f', 'ogg'
	], ext, 'ogg')
}

function toVideo(buffer, ext) {
	return ffmpegcli(buffer, [
		'-c:v', 'libx264',
		'-c:a', 'aac',
		'-ab', '128k',
		'-ar', '44100',
		'-crf', '32',
		'-preset', 'slow'
	], ext, 'mp4')
}

async function webp2mp4(source) {
	let form = new FormData
	let isUrl = typeof source === 'string' && /https?:\/\//.test(source)
	form.append('new-image-url', isUrl ? source : '')
	form.append('new-image', isUrl ? '' : source, 'image.webp')
	let res = await fetch('https://ezgif.com/webp-to-mp4', {
		method: 'POST',
		body: form
	})
	let html = await res.text()
	let { document } = new JSDOM(html).window
	let form2 = new FormData
	let obj = {}
	for (let input of document.querySelectorAll('form input[name]')) {
		obj[input.name] = input.value
		form2.append(input.name, input.value)
	}
	let res2 = await fetch('https://ezgif.com/webp-to-mp4/' + obj.file, {
		method: 'POST',
		body: form2
	})
	let html2 = await res2.text()
	let { document: document2 } = new JSDOM(html2).window
	return new URL(document2.querySelector('div#output > p.outfile > video > source').src, res2.url).toString()
}

async function webp2png(source) {
	let form = new FormData
	let isUrl = typeof source === 'string' && /https?:\/\//.test(source)
	form.append('new-image-url', isUrl ? source : '')
	form.append('new-image', isUrl ? '' : source, 'image.webp')
	let res = await fetch('https://ezgif.com/webp-to-png', {
		method: 'POST',
		body: form
	})
	let html = await res.text()
	let { document } = new JSDOM(html).window
	let form2 = new FormData
	let obj = {}
	for (let input of document.querySelectorAll('form input[name]')) {
		obj[input.name] = input.value
		form2.append(input.name, input.value)
	}
	let res2 = await fetch('https://ezgif.com/webp-to-png/' + obj.file, {
		method: 'POST',
		body: form2
	})
	let html2 = await res2.text()
	let { document: document2 } = new JSDOM(html2).window
	return new URL(document2.querySelector('div#output > p.outfile > img').src, res2.url).toString()
}

async function convertToMp3(input, output) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(input, (err, metadata) => {
      if (err) return reject(err);

      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      const codec = audioStream?.codec_name;

      let command = ffmpeg(input);

      if (codec === 'mp3') {
        command
          .outputOptions(['-c:a', 'copy', '-f', 'mp3']);
      } else {
        command
          .audioCodec('libmp3lame')
          .audioQuality(2)
          .outputOptions(['-f', 'mp3']);
      }

      command
        .save(output)
        .on('end', resolve)
        .on('error', reject);
    });
  });
}

export {
	toAudio,
	toVideo,
	ffmpegcli as ffmpeg,
	webp2mp4,
	webp2png,
	convertToMp3
}