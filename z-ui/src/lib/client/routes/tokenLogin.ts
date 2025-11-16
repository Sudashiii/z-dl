import type { ZTokenLoginRequest } from "$lib/types/ZLibrary/Requests/ZTokenLoginRequest";
import { okGuard } from "../base/okGuard";
import { post } from "../base/post";
import { ZUIRoutes } from "../base/routes";

export async function tokenLogin(request: ZTokenLoginRequest): Promise<void>{
    const res = await post(ZUIRoutes.tokenLogin, JSON.stringify(request));
    okGuard(res);
}
