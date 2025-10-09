import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const protoExtract = async () => {
	console.time(__filename);

	const fetchText = async (url) => (await fetch(url)).text();

	const protoDirectory = path.join(
		__dirname,
		'node_modules',
		'baileys',
		'WAProto'
	);

	const protoFiles = ['dist/index.d.ts', 'dist/index.js', 'WAProto.proto'];
	const protoUrl = 'https://github.com/Akkun3704/wa-proto/raw/main/';
	const tasks = protoFiles.map(async (file) =>
		fs.promises.writeFile(
			path.join(
				protoDirectory,
				path.basename(file)
			),
			await fetchText(protoUrl + file)
		)
	);

	await Promise.all(tasks);

	console.timeEnd(__filename);
}
protoExtract();