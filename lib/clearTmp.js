import Helper from './helper.js'
import { promises as fs } from 'fs'
import { tmpdir, platform } from 'os'
import { join } from 'path'

const TIME = 1000 * 60 * 10

const __dirname = Helper.__dirname(import.meta)

export default async function clearTmp() {
	const tmp = [tmpdir(), join(__dirname, '../tmp')]
	const filename = []

	await Promise.allSettled(tmp.map(async (dir) => {
		const files = await fs.readdir(dir)
		if (files.length > 1) {
			for (const file of files) {
				filename.push(join(dir, file))
			}
		}
	}))

	return await Promise.allSettled(filename.map(async (file) => {
		const stat = await fs.stat(file)
		if (stat.isFile() && (Date.now() - stat.mtimeMs >= TIME)) {
			if (platform() === 'win32') {
				let fileHandle
				try {
					fileHandle = await fs.open(file, 'r+')
				} catch (e) {
					return e
				} finally {
					await fileHandle?.close()
				}
			}
			await fs.unlink(file)
		}
	}))
}