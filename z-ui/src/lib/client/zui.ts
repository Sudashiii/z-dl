import type { ZLoginRequest } from '$lib/types/ZLibrary/Requests/ZLoginRequest';
import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
import type { ZTokenLoginRequest } from '$lib/types/ZLibrary/Requests/ZTokenLoginRequest';
import type { ZSearchBookResponse } from '$lib/types/ZLibrary/Responses/ZSearchBookResponse';
import type { ZBook } from '$lib/types/ZLibrary/ZBook';
import { authCheck } from './routes/authCheck';
import { downloadBook } from './routes/downloadBook';
import { passwordLogin } from './routes/passwordLogin';
import { searchBook } from './routes/searchBook';
import { tokenLogin } from './routes/tokenLogin';

export class ZUI {

    public static async searchBook(request: ZSearchBookRequest): Promise<ZSearchBookResponse> {
        return searchBook(request);
    }

    public static async passwordLogin(request: ZLoginRequest): Promise<ZLoginResponse> {
        return passwordLogin(request);
    }

    public static async tokenLogin(request: ZTokenLoginRequest): Promise<any> {
        return tokenLogin(request);
    }

    public static async authCheck(): Promise<any> {
        return authCheck();
    }

    public static async downloadBook(request: ZBook): Promise<any> {
        return downloadBook(request);
    }
}