import { command } from '$app/server'; // or correct import based on your version/adapter
import { DavUploadServiceFactory } from '$lib/server/application/factories/DavUploadServiceFactory';
import { ZLibrary } from '$lib/server/application/ZLibrary';
import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';

const zlib = new ZLibrary("https://1lib.sk");

// @ts-ignore - signature mismatch with command wrapper
export const downloadBook = command(async (data: ZDownloadBookRequest, event: any) => {
    const { bookId, hash, upload, title, extension, author, cover, filesize, language, year, downloadToDevice } = data;
    const { locals } = event;

    if (!locals.zuser) {
        throw new Error('ZLib Login is not valid!');
    }

    if (!bookId || !hash) {
        throw new Error('Missing bookId or hash parameter');
    }

    try {
        const loggedIn = await zlib.tokenLogin(locals.zuser.userId, locals.zuser.userKey);
        if (!loggedIn) {
            throw new Error('Z-Lib Login failed');
        }

        const bookDownloadResponse = await zlib.download(bookId, hash);
        const fileBuffer = await bookDownloadResponse.arrayBuffer();
        const bufferObj = Buffer.from(fileBuffer);

        if (upload) {
            const uploadService = DavUploadServiceFactory.createS3();
            const key = `${title}_${bookId}.${extension}`;

            await uploadService.upload(key, bufferObj);
            await BookRepository.create({
                s3_storage_key: key,
                title: title,
                zLibId: bookId,
                author: author ?? null,
                cover: cover ?? null,
                extension: extension ?? null,
                filesize: filesize ?? null,
                language: language ?? null,
                year: year ?? null,
                isDownloaded: false
            });
        }

        if (downloadToDevice === false) {
            return { success: true };
        }

        return {
            success: true,
            fileName: `${title}.${extension}`,
            fileData: new Uint8Array(fileBuffer),
            contentType: bookDownloadResponse.headers.get('content-type') || 'application/octet-stream'
        };

    } catch (err: any) {
        console.error("Remote function error:", err);
        throw new Error(err.message || 'File not found');
    }
});