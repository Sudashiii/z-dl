import path from "path";
import type { IDavStorage } from "../abstractions/IDavStorage";
import { mimeTypes } from "../constants/mimeTypes";

export class DavUploadService {

    #libraryFolder: string = "library";
    #davStorage: IDavStorage;
    constructor(davStorage: IDavStorage) {
        this.#davStorage = davStorage;
    }


    async upload(fileName: string, data: Buffer): Promise<void> {
        const extension = fileName.split('.').pop()?.toLowerCase() || 'default';
        const contentType: string = mimeTypes[extension] || mimeTypes.default;
        const key = path.join(this.#libraryFolder, fileName);

        console.log(`Uploading file to DAV storage with key: ${key}, contentType: ${contentType}, size: ${data.length} bytes`);
        await this.#davStorage.put(key, data, contentType);
    }
}