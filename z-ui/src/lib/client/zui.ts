import type { Result } from '$lib/types/Result';
import type { ApiError } from '$lib/types/ApiError';
import type { ZLoginRequest } from '$lib/types/ZLibrary/Requests/ZLoginRequest';
import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
import type { ZTokenLoginRequest } from '$lib/types/ZLibrary/Requests/ZTokenLoginRequest';
import type { ZSearchBookResponse } from '$lib/types/ZLibrary/Responses/ZSearchBookResponse';
import type { ZLoginResponse } from '$lib/types/ZLibrary/Responses/ZLoginResponse';
import type { ZBook } from '$lib/types/ZLibrary/ZBook';
import { authCheck } from './routes/authCheck';
import { downloadBook } from './routes/downloadBook';
import { passwordLogin } from './routes/passwordLogin';
import { searchBook } from './routes/searchBook';
import { tokenLogin } from './routes/tokenLogin';
import { getLibrary, type LibraryResponse } from './routes/getLibrary';
import { getLibraryTrash, type LibraryTrashResponse } from './routes/getLibraryTrash';
import { getLibraryBookDetail } from './routes/getLibraryBookDetail';
import {
	refetchLibraryBookMetadata,
	type RefetchLibraryBookMetadataResponse
} from './routes/refetchLibraryBookMetadata';
import { removeLibraryBookDeviceDownload } from './routes/removeLibraryBookDeviceDownload';
import { resetDownloadStatus } from './routes/resetDownloadStatus';
import { moveLibraryBookToTrash } from './routes/moveLibraryBookToTrash';
import { restoreLibraryBook } from './routes/restoreLibraryBook';
import { queueToLibrary, type QueueResponse } from './routes/queueToLibrary';
import type { LibraryBookDetail } from '$lib/types/Library/BookDetail';
import { downloadLibraryBookFile } from './routes/downloadLibraryBookFile';
import {
	updateLibraryBookRating,
	type UpdateLibraryBookRatingResponse
} from './routes/updateLibraryBookRating';
import { getLibraryRatings, type LibraryRatingsResponse } from './routes/getLibraryRatings';
import {
	updateLibraryBookState,
	type UpdateLibraryBookStateResponse
} from './routes/updateLibraryBookState';

/**
 * Facade for all Z-Library UI client operations.
 * All methods return Result types for type-safe error handling.
 */
export const ZUI = {
	searchBook: (request: ZSearchBookRequest): Promise<Result<ZSearchBookResponse, ApiError>> =>
		searchBook(request),

	passwordLogin: (request: ZLoginRequest): Promise<Result<ZLoginResponse, ApiError>> =>
		passwordLogin(request),

	tokenLogin: (request: ZTokenLoginRequest): Promise<Result<void, ApiError>> =>
		tokenLogin(request),

	authCheck: (): Promise<Result<void, ApiError>> => authCheck(),

	downloadBook: (book: ZBook, options?: { downloadToDevice?: boolean }): Promise<Result<void, ApiError>> =>
		downloadBook(book, options),

	queueToLibrary: (book: ZBook): Promise<Result<QueueResponse, ApiError>> =>
		queueToLibrary(book),

	getLibrary: (): Promise<Result<LibraryResponse, ApiError>> => getLibrary(),

	getLibraryTrash: (): Promise<Result<LibraryTrashResponse, ApiError>> => getLibraryTrash(),

	getLibraryBookDetail: (bookId: number): Promise<Result<LibraryBookDetail, ApiError>> =>
		getLibraryBookDetail(bookId),

	refetchLibraryBookMetadata: (
		bookId: number
	): Promise<Result<RefetchLibraryBookMetadataResponse, ApiError>> =>
		refetchLibraryBookMetadata(bookId),

	removeLibraryBookDeviceDownload: (bookId: number, deviceId: string): Promise<Result<void, ApiError>> =>
		removeLibraryBookDeviceDownload(bookId, deviceId),

	resetDownloadStatus: (bookId: number): Promise<Result<void, ApiError>> =>
		resetDownloadStatus(bookId),

	moveLibraryBookToTrash: (bookId: number) => moveLibraryBookToTrash(bookId),

	restoreLibraryBook: (bookId: number) => restoreLibraryBook(bookId),

	downloadLibraryBookFile: (storageKey: string, fileName: string) =>
		downloadLibraryBookFile(storageKey, fileName),

	updateLibraryBookRating: (
		bookId: number,
		rating: number | null
	): Promise<Result<UpdateLibraryBookRatingResponse, ApiError>> =>
		updateLibraryBookRating(bookId, rating),

	getLibraryRatings: (): Promise<Result<LibraryRatingsResponse, ApiError>> => getLibraryRatings(),

	updateLibraryBookState: (
		bookId: number,
		request: { isRead?: boolean; excludeFromNewBooks?: boolean }
	): Promise<Result<UpdateLibraryBookStateResponse, ApiError>> =>
		updateLibraryBookState(bookId, request)
} as const;

export type ZUIClient = typeof ZUI;
