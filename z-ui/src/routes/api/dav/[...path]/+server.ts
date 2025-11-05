import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { S3Storage } from '$lib/server/application/S3Storage';
import { mimeTypes } from '$lib/server/constants/mimeTypes';
import { requireBasicAuth } from '$lib/server/auth/basicAuth';

const s3 = new S3Storage();

function normalizeKey(path: string | undefined): string {
	return path?.replace(/^\/+/, '').replace(/\/+$/, '') ?? '';
}

// -------------------------------
// PROPFIND /api/dav/*path
// -------------------------------
export const fallback: RequestHandler = async ({ request, url }) => {
    if (request.method !== 'PROPFIND') {
        return new Response('Method Not Allowed', { status: 405 });
	}

	try {
		const rawPath = url.pathname.replace(/^\/api\/dav\/?/, '');
		const path = rawPath === '' ? '' : normalizeKey(rawPath);

		// Get all objects under this path
		const objects = await s3.list(path);

		// Build WebDAV XML
		const xmlResponse = `
			<D:multistatus xmlns:D="DAV:">
				<D:response>
					<D:href>${path === '' ? '/' : `/${encodeURIComponent(path)}`}</D:href>
					<D:propstat>
						<D:prop>
							<D:resourcetype><D:collection/></D:resourcetype>
							<D:displayname>${path === '' ? 'root' : path.split('/').pop()}</D:displayname>
						</D:prop>
						<D:status>HTTP/1.1 200 OK</D:status>
					</D:propstat>
				</D:response>
				${objects
					.map((obj) => {
						const ext = obj.key.split('.').pop()?.toLowerCase() || 'default';
						const mime = mimeTypes[ext] || mimeTypes.default;
						const display = obj.key.split('/').pop() ?? obj.key;
						const href = `/${encodeURIComponent(obj.key)}`;

						return `
							<D:response>
								<D:href>${href}</D:href>
								<D:propstat>
									<D:prop>
										<D:resourcetype/> <!-- Empty for files -->
										<D:getcontentlength>${obj.size}</D:getcontentlength>
										<D:getlastmodified>${obj.lastModified?.toUTCString() ?? ''}</D:getlastmodified>
										<D:getcontenttype>${mime}</D:getcontenttype>
										<D:displayname>${display}</D:displayname>
									</D:prop>
									<D:status>HTTP/1.1 200 OK</D:status>
								</D:propstat>
							</D:response>`;
					})
					.join('')}
			</D:multistatus>
		`;

		return new Response(xmlResponse.trim(), {
			status: 207, 
			headers: {
				'Content-Type': 'application/xml; charset=utf-8'
			}
		});
	} catch (err: any) {
		console.error('PROPFIND error:', err);
		return new Response(
			JSON.stringify({
				error: 'Failed to list directory',
				details: err.message
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
