import { ZLibraryClient } from '$lib/server/infrastructure/clients/ZLibraryClient';
import { S3Storage } from '$lib/server/infrastructure/storage/S3Storage';
import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import { DeviceDownloadRepository } from '$lib/server/infrastructure/repositories/DeviceDownloadRepository';
import { DeviceProgressDownloadRepository } from '$lib/server/infrastructure/repositories/DeviceProgressDownloadRepository';
import { DavUploadServiceFactory } from '$lib/server/infrastructure/factories/DavUploadServiceFactory';
import { downloadQueue } from '$lib/server/infrastructure/queue/downloadQueue';
import { DownloadBookUseCase } from '$lib/server/application/use-cases/DownloadBookUseCase';
import { QueueDownloadUseCase } from '$lib/server/application/use-cases/QueueDownloadUseCase';
import { ZLibrarySearchUseCase } from '$lib/server/application/use-cases/ZLibrarySearchUseCase';
import { ZLibraryTokenLoginUseCase } from '$lib/server/application/use-cases/ZLibraryTokenLoginUseCase';
import { ZLibraryPasswordLoginUseCase } from '$lib/server/application/use-cases/ZLibraryPasswordLoginUseCase';
import { ZLibraryLogoutUseCase } from '$lib/server/application/use-cases/ZLibraryLogoutUseCase';
import { ListLibraryUseCase } from '$lib/server/application/use-cases/ListLibraryUseCase';
import {
	GetLibraryBookDetailUseCase
} from '$lib/server/application/use-cases/GetLibraryBookDetailUseCase';
import {
	RefetchLibraryBookMetadataUseCase
} from '$lib/server/application/use-cases/RefetchLibraryBookMetadataUseCase';
import { GetNewBooksForDeviceUseCase } from '$lib/server/application/use-cases/GetNewBooksForDeviceUseCase';
import { ConfirmDownloadUseCase } from '$lib/server/application/use-cases/ConfirmDownloadUseCase';
import { RemoveDeviceDownloadUseCase } from '$lib/server/application/use-cases/RemoveDeviceDownloadUseCase';
import { ResetDownloadStatusUseCase } from '$lib/server/application/use-cases/ResetDownloadStatusUseCase';
import { GetProgressUseCase } from '$lib/server/application/use-cases/GetProgressUseCase';
import { PutProgressUseCase } from '$lib/server/application/use-cases/PutProgressUseCase';
import { GetNewProgressForDeviceUseCase } from '$lib/server/application/use-cases/GetNewProgressForDeviceUseCase';
import { ConfirmProgressDownloadUseCase } from '$lib/server/application/use-cases/ConfirmProgressDownloadUseCase';
import { GetLibraryFileUseCase } from '$lib/server/application/use-cases/GetLibraryFileUseCase';
import { PutLibraryFileUseCase } from '$lib/server/application/use-cases/PutLibraryFileUseCase';
import { DeleteLibraryFileUseCase } from '$lib/server/application/use-cases/DeleteLibraryFileUseCase';
import { ListDavDirectoryUseCase } from '$lib/server/application/use-cases/ListDavDirectoryUseCase';
import { MoveLibraryBookToTrashUseCase } from '$lib/server/application/use-cases/MoveLibraryBookToTrashUseCase';
import { ListLibraryTrashUseCase } from '$lib/server/application/use-cases/ListLibraryTrashUseCase';
import { RestoreLibraryBookUseCase } from '$lib/server/application/use-cases/RestoreLibraryBookUseCase';
import { PurgeExpiredTrashUseCase } from '$lib/server/application/use-cases/PurgeExpiredTrashUseCase';
import { KoreaderPluginArtifactService } from '$lib/server/application/services/KoreaderPluginArtifactService';
import { SyncKoreaderPluginReleaseUseCase } from '$lib/server/application/use-cases/SyncKoreaderPluginReleaseUseCase';
import { GetLatestKoreaderPluginUseCase } from '$lib/server/application/use-cases/GetLatestKoreaderPluginUseCase';
import { GetKoreaderPluginDownloadUseCase } from '$lib/server/application/use-cases/GetKoreaderPluginDownloadUseCase';
import { PluginReleaseRepository } from '$lib/server/infrastructure/repositories/PluginReleaseRepository';

export const zlibraryClient = new ZLibraryClient('https://1lib.sk');
export const storage = new S3Storage();
export const koreaderPluginArtifactService = new KoreaderPluginArtifactService();
export const pluginReleaseRepository = new PluginReleaseRepository();
export const bookRepository = new BookRepository();
export const deviceDownloadRepository = new DeviceDownloadRepository();
export const deviceProgressDownloadRepository = new DeviceProgressDownloadRepository();

export const downloadBookUseCase = new DownloadBookUseCase(
	zlibraryClient,
	bookRepository,
	() => DavUploadServiceFactory.createS3()
);
export const queueDownloadUseCase = new QueueDownloadUseCase(downloadQueue);
export const zlibrarySearchUseCase = new ZLibrarySearchUseCase(zlibraryClient);
export const zlibraryTokenLoginUseCase = new ZLibraryTokenLoginUseCase(zlibraryClient);
export const zlibraryPasswordLoginUseCase = new ZLibraryPasswordLoginUseCase(zlibraryClient);
export const zlibraryLogoutUseCase = new ZLibraryLogoutUseCase();

export const listLibraryUseCase = new ListLibraryUseCase(bookRepository);
export const getLibraryBookDetailUseCase = new GetLibraryBookDetailUseCase(
	bookRepository,
	deviceDownloadRepository
);
export const refetchLibraryBookMetadataUseCase = new RefetchLibraryBookMetadataUseCase(
	bookRepository,
	zlibraryClient
);
export const getNewBooksForDeviceUseCase = new GetNewBooksForDeviceUseCase(bookRepository);
export const confirmDownloadUseCase = new ConfirmDownloadUseCase(deviceDownloadRepository);
export const removeDeviceDownloadUseCase = new RemoveDeviceDownloadUseCase(deviceDownloadRepository);
export const resetDownloadStatusUseCase = new ResetDownloadStatusUseCase(bookRepository);

export const getProgressUseCase = new GetProgressUseCase(bookRepository, storage);
export const putProgressUseCase = new PutProgressUseCase(
	bookRepository,
	storage,
	deviceProgressDownloadRepository
);
export const getNewProgressForDeviceUseCase = new GetNewProgressForDeviceUseCase(bookRepository);
export const confirmProgressDownloadUseCase = new ConfirmProgressDownloadUseCase(
	bookRepository,
	deviceProgressDownloadRepository
);

export const getLibraryFileUseCase = new GetLibraryFileUseCase(storage);
export const putLibraryFileUseCase = new PutLibraryFileUseCase(storage, bookRepository);
export const deleteLibraryFileUseCase = new DeleteLibraryFileUseCase(storage);
export const listDavDirectoryUseCase = new ListDavDirectoryUseCase(storage);
export const moveLibraryBookToTrashUseCase = new MoveLibraryBookToTrashUseCase(bookRepository);
export const listLibraryTrashUseCase = new ListLibraryTrashUseCase(bookRepository);
export const restoreLibraryBookUseCase = new RestoreLibraryBookUseCase(bookRepository);
export const purgeExpiredTrashUseCase = new PurgeExpiredTrashUseCase(bookRepository, storage);
export const syncKoreaderPluginReleaseUseCase = new SyncKoreaderPluginReleaseUseCase(
	storage,
	pluginReleaseRepository,
	koreaderPluginArtifactService
);
export const getLatestKoreaderPluginUseCase = new GetLatestKoreaderPluginUseCase(pluginReleaseRepository);
export const getKoreaderPluginDownloadUseCase = new GetKoreaderPluginDownloadUseCase(
	storage,
	getLatestKoreaderPluginUseCase
);
