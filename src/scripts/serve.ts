import { createReadStream, existsSync, statSync } from 'fs';
import { createServer } from 'http';
import { extname, join, normalize } from 'path';
import { DIST_FOLDER_PATH } from '../definitions/paths';

const DEFAULT_PORT = 3004;

const CONTENT_TYPES: Record<string, string> = {
	'.json': 'application/json; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
};

export default function serve(portArg: string | undefined): void {
	const port = Number(portArg) || DEFAULT_PORT;

	if (!existsSync(DIST_FOLDER_PATH)) {
		console.error("No 'dist' folder found. Run `yarn build` first.");
		return;
	}

	const server = createServer((req, res) => {
		// Allow the songbook app (different origin/port) to fetch these files.
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', '*');

		if (req.method === 'OPTIONS') {
			res.writeHead(204);
			res.end();
			return;
		}

		if (req.method !== 'GET' && req.method !== 'HEAD') {
			res.writeHead(405);
			res.end('Method Not Allowed');
			return;
		}

		// Default to songs.json at the root for convenience.
		const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
		const relativePath = urlPath === '/' ? 'songs.json' : urlPath.replace(/^\/+/, '');
		const filePath = normalize(join(DIST_FOLDER_PATH, relativePath));

		// Prevent path traversal outside of dist/.
		if (!filePath.startsWith(DIST_FOLDER_PATH)) {
			res.writeHead(403);
			res.end('Forbidden');
			return;
		}

		if (!existsSync(filePath) || !statSync(filePath).isFile()) {
			res.writeHead(404);
			res.end('Not Found');
			return;
		}

		res.writeHead(200, {
			'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
		});

		if (req.method === 'HEAD') {
			res.end();
			return;
		}

		createReadStream(filePath).pipe(res);
	});

	server.listen(port, () => {
		console.log(`Serving songs from 'dist' on http://localhost:${port}`);
		console.log(`  → http://localhost:${port}/songs.json`);
		console.log(`  → http://localhost:${port}/songs.xml`);
		console.log('CORS is enabled for all origins (e.g. the songbook app on :3005).');
	});
}
