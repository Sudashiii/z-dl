import type { ZSearchBookRequest } from "$lib/types/ZLibrary/Requests/ZSearchBookRequest";
import type { ZBookFileResponse } from "$lib/types/ZLibrary/Responses/ZBookFileResponse";
import type { ZSearchBookResponse } from "$lib/types/ZLibrary/Responses/ZSearchBookResponse";
import type { ZBook } from "$lib/types/ZLibrary/ZBook";
import type { IZLibrary } from "../abstractions/IZLibrary";
import { toUrlEncoded } from "../util/toUrlEncode";

export class ZLibrary implements IZLibrary
{
    private baseUrl: string;
    private userId: string | null = null;
    private userKey: string | null = null;

    constructor(baseUrl: string)
    {
        this.baseUrl = baseUrl;
    }
    
    async search(searchRequest: ZSearchBookRequest): Promise<ZSearchBookResponse> {
        const body: Record<string, any> = {};
        const {
            searchText,
            yearFrom,
            yearTo,
            languages,
            extensions,
            order,
            limit
        } = searchRequest;
        
        if (searchText) body.message = searchText;
        if (yearFrom) body.yearFrom = yearFrom;
        if (yearTo) body.yearTo = yearTo;
        if (languages?.length) body.languages = languages;
        if (extensions?.length) body.extensions = extensions;
        if (order) body.order = order;
        if (limit !== undefined) body.limit = limit;

        console.log(toUrlEncoded(body));

        const res = await this.post('/eapi/book/search', body);

        return res;
    }

    async download(bookId: string, hash: string) {
        console.log(`Downloading book ${bookId} with hash ${hash}`);
        //@ts-ignore
        const response = await this.get(`/eapi/book/${bookId}/${hash}/file`);
        const json: ZBookFileResponse = await response.json();

        const file = await this.get2(json.file.downloadLink);
        return file;
    }

    signup(email: string, name: string, password: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    passwordLogin(name: string, password: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async tokenLogin(id: string, token: string): Promise<boolean> {
        this.userId = id;
        this.userKey = token;

        const res = await this.get(ZLibraryRoutes.profile);

        if(res.status === 200){
            return true;
        }

        this.userId = null;
        this.userKey = null;
        return false;
    }

    private getCookies(){
        if(!this.userId || !this.userKey){
            throw new Error("Not logged in");
        }

        const cookies = {
            "siteLanguageV2": "en",
            "remix_userid": this.userId,
            "remix_userkey": this.userKey,
        };

        const cookieHeader = Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');

        return cookieHeader;
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'accept':
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'en-US,en;q=0.9',
            'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        };

        if (this.isLoggedIn()) {
            headers['Cookie'] = this.getCookies();
        }

        return headers;
    }

    private isLoggedIn(): boolean {
        return this.userId !== null && this.userKey !== null;
    }

    private async get(path: string){
        const res = await fetch(this.baseUrl + path, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        return res;
    }

    private async get2(path: string){
        const res = await fetch(path, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        return res;
    }

    private async post(path: string, data: Record<string, any>) {
        const res = await fetch(this.baseUrl + path, {
            method: 'POST',
            headers: this.getHeaders(),
            body: toUrlEncoded(data)
        });

        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
        }

        return res.json();
    }
    
}

const ZLibraryRoutes: Record<string, string> = {
    passwordLogin: '/eapi/user/login',
    profile: '/eapi/user/profile',
    search: '/eapi/book/search',
    getBookFile: '/eapi/book/{0}/{1}/file',
}