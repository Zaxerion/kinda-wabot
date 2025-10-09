import axios from 'axios'
import * as cheerio from 'cheerio'
import * as Jimp from 'jimp'
import { spawn } from 'child_process'

const delay = time => new Promise(res => setTimeout(res, time))

function generate(n) {
	var add = 1, max = 12 - add
	if (n > max) return generate(max) + generate(n - max)
	max = Math.pow(10, n + add)
	var min = max / 10
	var number = Math.floor(Math.random() * (max - min + 1)) + min
	return ('' + number).substring(add)
}

function isNumber(number) {
	if (!number) return number
	number = parseInt(number)
	return typeof number == 'number' && !isNaN(number)
}

const headers = {
	"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
	"cookie": "PHPSESSID=ugpgvu6fgc4592jh7ht9d18v49; _ga=GA1.2.1126798330.1625045680; _gid=GA1.2.1475525047.1625045680; __gads=ID=92b58ed9ed58d147-221917af11ca0021:T=1625045679:RT=1625045679:S=ALNI_MYnQToDW3kOUClBGEzULNjeyAqOtg"
}

function isUrl(string) {
	try {
		new URL(string);
		return true;
	} catch (err) {
		return false;
	}
}

function niceBytes(x) {
	let units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	let l = 0, n = parseInt(x, 10) || 0;
	while (n >= 1024 && ++l) {
		n = n / 1024;
	}
	return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
}

function padLead(num, size) {
	var s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}

function ranNumb(min, max = null) {
	if (max !== null) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	} else {
		return Math.floor(Math.random() * min) + 1
	}
}

const mime = await (await fetch('https://raw.githubusercontent.com/clicknetcafe/json-db/refs/heads/main/mime.json')).json()
const readMore = String.fromCharCode(8206).repeat(4001)

function runtime(seconds) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
	var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

const somematch = (data, id) => {
	let res = data.find(el => el === id)
	return res ? true : false;
}

function stream2buffer(stream) {
	return new Promise((resolve, reject) => {
		const _buf = [];
		stream.on("data", (chunk) => _buf.push(chunk));
		stream.on("end", () => resolve(Buffer.concat(_buf)));
		stream.on("error", (err) => reject(err));
	})
}

class SimpleQueue {
	constructor(concurrency = 1, delay = 0) {
		this.concurrency = concurrency
		this.delay = delay
		this.running = 0
		this.queue = []
	}

	async add(task) {
		return new Promise((resolve, reject) => {
			this.queue.push(async () => {
				try {
					this.running++
					const result = await task()
					resolve(result)
				} catch (err) {
					reject(err)
				} finally {
					this.running--
					setTimeout(() => this.next(), this.delay)
				}
			})
			process.nextTick(this.next.bind(this))
		})
	}

	next() {
		if (this.running >= this.concurrency) return
		const job = this.queue.shift()
		if (job) job()
	}
}
const queue = new SimpleQueue(2, 3000) // 1 task sekaligus, delay 2 detik


export {
	delay,
	generate,
	isUrl,
	isNumber,
	headers,
	mime,
	niceBytes,
	padLead,
	ranNumb,
	runtime,
	readMore,
	somematch,
	stream2buffer,
	queue
}