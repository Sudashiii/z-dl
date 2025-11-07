export interface ZDownloadBookRequest {
    bookId: string;
    hash: string;
    title: string;
    upload: boolean;
    extension: string;
}