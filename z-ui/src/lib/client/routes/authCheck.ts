import { get } from "../base/get";
import { okGuard } from "../base/okGuard";
import { ZUIRoutes } from "../base/routes";

export async function authCheck(): Promise<void>{
    const res = await get(ZUIRoutes.authCheck);

    okGuard(res);
}
