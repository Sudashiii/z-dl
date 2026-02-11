import JSZip from 'jszip';
import { apiError, apiOk, type ApiResult } from '$lib/server/http/api';

const CONTAINER_PATH = 'META-INF/container.xml';
const MIMETYPE_PATH = 'mimetype';
const EPUB_MIMETYPE = 'application/epub+zip';
const ROOTFILE_PATH_REGEX = /<rootfile\b[^>]*\bfull-path\s*=\s*(["'])([^"']+)\1/i;
const DC_TITLE_REGEX = /<dc:title\b([^>]*)>[\s\S]*?<\/dc:title>/i;

function escapeXmlText(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export class EpubMetadataService {
	async rewriteTitle(epubBuffer: Buffer, title: string): Promise<ApiResult<Buffer>> {
		const normalizedTitle = title.trim();
		if (!normalizedTitle) {
			return apiError('Cannot rewrite EPUB title: title is empty', 400);
		}

		try {
			const zip = await JSZip.loadAsync(epubBuffer);

			const mimetypeEntry = zip.file(MIMETYPE_PATH);
			if (!mimetypeEntry) {
				return apiError('Cannot rewrite EPUB title: missing mimetype file', 422);
			}
			const mimetypeValue = (await mimetypeEntry.async('string')).trim();
			if (mimetypeValue !== EPUB_MIMETYPE) {
				return apiError('Cannot rewrite EPUB title: invalid mimetype value', 422);
			}

			const containerEntry = zip.file(CONTAINER_PATH);
			if (!containerEntry) {
				return apiError('Cannot rewrite EPUB title: missing META-INF/container.xml', 422);
			}

			const containerXml = await containerEntry.async('string');
			const rootfileMatch = containerXml.match(ROOTFILE_PATH_REGEX);
			const opfPath = rootfileMatch?.[2];
			if (!opfPath) {
				return apiError('Cannot rewrite EPUB title: OPF path not found in container.xml', 422);
			}

			const opfEntry = zip.file(opfPath);
			if (!opfEntry) {
				return apiError(`Cannot rewrite EPUB title: OPF not found at ${opfPath}`, 422);
			}

			const opfXml = await opfEntry.async('string');
			if (!DC_TITLE_REGEX.test(opfXml)) {
				return apiError('Cannot rewrite EPUB title: <dc:title> not found in OPF', 422);
			}

			const escapedTitle = escapeXmlText(normalizedTitle);
			const updatedOpfXml = opfXml.replace(DC_TITLE_REGEX, `<dc:title$1>${escapedTitle}</dc:title>`);
			
			// Rebuild EPUB in spec-compliant order:
			// 1) uncompressed mimetype as first entry
			// 2) all other entries, with OPF content replaced
			const rebuiltZip = new JSZip();
			rebuiltZip.file(MIMETYPE_PATH, EPUB_MIMETYPE, { compression: 'STORE' });

			for (const [entryName, entry] of Object.entries(zip.files)) {
				if (entry.dir || entryName === MIMETYPE_PATH) {
					continue;
				}

				if (entryName === opfPath) {
					rebuiltZip.file(entryName, updatedOpfXml);
					continue;
				}

				const bytes = await entry.async('uint8array');
				rebuiltZip.file(entryName, bytes);
			}

			const rebuiltEpub = await rebuiltZip.generateAsync({
				type: 'nodebuffer',
				compression: 'DEFLATE',
				streamFiles: false
			});

			return apiOk(rebuiltEpub);
		} catch (cause) {
			return apiError('Cannot rewrite EPUB title: invalid EPUB archive', 422, cause);
		}
	}
}
