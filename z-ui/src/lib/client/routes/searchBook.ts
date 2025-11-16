import type { ZSearchBookRequest } from "$lib/types/ZLibrary/Requests/ZSearchBookRequest";
import type { ZSearchBookResponse } from "$lib/types/ZLibrary/Responses/ZSearchBookResponse";
import { okGuard } from "../base/okGuard";
import { post } from "../base/post";
import { ZUIRoutes } from "../base/routes";

export async function searchBook(request: ZSearchBookRequest): Promise<ZSearchBookResponse>{
    const res = await post(ZUIRoutes.searchBook, JSON.stringify(request));

    okGuard(res);

    return res.json();
}
