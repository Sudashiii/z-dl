import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
import type { ZSearchBookResponse } from '$lib/types/ZLibrary/Responses/ZSearchBookResponse';
import type { ZLoginResponse } from '$lib/types/ZLibrary/Responses/ZLoginResponse';

export interface IZLibrary {

    signup(email: string, name: string, password: string): Promise<boolean>;
    passwordLogin(name: string, password: string): Promise<ZLoginResponse>;
    tokenLogin(id: string, token: string): Promise<boolean>;
    search(SearchBookRequest: ZSearchBookRequest): Promise<ZSearchBookResponse>;
}


