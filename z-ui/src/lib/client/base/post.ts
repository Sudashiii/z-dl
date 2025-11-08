import { generateAuthHeader } from "./authHeader";

export async function post(endpoint: string, body: string){
        const res = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: generateAuthHeader()
			},
			body: body
		});

        return res;
}