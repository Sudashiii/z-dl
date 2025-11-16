import type { ZLoginRequest } from "$lib/types/ZLibrary/Requests/ZLoginRequest";
import { okGuard } from "../base/okGuard";
import { post } from "../base/post";
import { ZUIRoutes } from "../base/routes";

export async function passwordLogin(request: ZLoginRequest): Promise<ZLoginResponse>{
    const res = await post(ZUIRoutes.passwordLogin, JSON.stringify(request));

    okGuard(res);

    return res.json();
}
