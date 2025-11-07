import { DavUploadService } from "../DavUploadService";
import { S3Storage } from "../S3Storage";

export class DavUploadServiceFactory {
    static createS3(): DavUploadService {
        const s3 = new S3Storage();
        return new DavUploadService(s3);
    }

}