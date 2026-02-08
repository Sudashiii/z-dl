import { command } from '$app/server'; // or correct import based on your version/adapter
import { downloadBookUseCase } from '$lib/server/application/composition';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';

// @ts-ignore - signature mismatch with command wrapper
export const downloadBook = command(async (data: ZDownloadBookRequest, event: any) => {
    const { bookId, hash, title, extension, downloadToDevice } = data;
    const { locals } = event;

    if (!locals.zuser) {
        throw new Error('ZLib Login is not valid!');
    }

    if (!bookId || !hash) {
        throw new Error('Missing bookId or hash parameter');
    }

	try {
	        const result = await downloadBookUseCase.execute({
	            request: data,
	            credentials: {
	                userId: locals.zuser.userId,
	                userKey: locals.zuser.userKey
	            }
	        });
	        if (!result.ok) {
	            throw new Error(result.error.message);
	        }

	        if (downloadToDevice === false) {
	            return { success: true };
	        }
	        if (!result.value.fileData) {
	            throw new Error('File download failed');
	        }

		        return {
		            success: true,
		            fileName: `${title}.${extension}`,
		            fileData: new Uint8Array(result.value.fileData),
		            contentType: result.value.responseHeaders?.get('content-type') || 'application/octet-stream'
		        };

    } catch (err: any) {
        console.error("Remote function error:", err);
        throw new Error(err.message || 'File not found');
    }
});
