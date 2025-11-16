import { generateAuthHeader } from "./authHeader";

export async function get(endpoint: string){
    const res = await fetch("/api" + endpoint, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: generateAuthHeader()
        }
    });

    return res;
}