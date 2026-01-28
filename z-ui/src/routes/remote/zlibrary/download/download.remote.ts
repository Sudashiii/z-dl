import { command } from '$app/server'; // or correct import based on your version/adapter
import { DavUploadServiceFactory } from '$lib/server/application/factories/DavUploadServiceFactory';
import { ZLibrary } from '$lib/server/application/ZLibrary';
import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';

const zlib = new ZLibrary("https://1lib.sk");

// @ts-ignore - signature mismatch with command wrapper
export const downloadBook = command(async (data: ZDownloadBookRequest, event: any) => {
    // 1. Destructure data and Get Context
    const { bookId, hash, upload, title, extension, author, cover, filesize, language, year, downloadToDevice } = data;
    const { locals } = event;

    // 2. Auth Check (Throw errors instead of returning 400/401 JSON)
    if (!locals.zuser) {
        throw new Error('ZLib Login is not valid!'); // Client will catch this
    }

    if (!bookId || !hash) {
        throw new Error('Missing bookId or hash parameter');
    }

    try {
        // 3. ZLib Login
        const loggedIn = await zlib.tokenLogin(locals.zuser.userId, locals.zuser.userKey);
        if (!loggedIn) {
            throw new Error('Z-Lib Login failed');
        }

        // 4. Download Logic
        const bookDownloadResponse = await zlib.download(bookId, hash);
        const fileBuffer = await bookDownloadResponse.arrayBuffer();
        const bufferObj = Buffer.from(fileBuffer);

        // 5. Optional S3 Upload
        if (upload) {
            const uploadService = DavUploadServiceFactory.createS3();
            const key = `${title}_${bookId}.${extension}`;

            // Parallelize these operations if possible, or await sequentially
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
                isDownloaded: (downloadToDevice !== false) // Mark as downloaded if we are sending to device
            });
        }

        // 6. Return Data
        if (downloadToDevice === false) {
            // Share only: just return success, no file data
            return { success: true };
        }

        // Download: return file data to client
        return {
            success: true,
            fileName: `${title}.${extension}`,
            fileData: new Uint8Array(fileBuffer),
            contentType: bookDownloadResponse.headers.get('content-type') || 'application/octet-stream'
        };

    } catch (err: any) {
        console.error("Remote function error:", err);
        // Re-throw or return a specific error object your UI expects
        throw new Error(err.message || 'File not found');
    }
});