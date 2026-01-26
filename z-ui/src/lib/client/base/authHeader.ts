import { type Result, ok, err } from '$lib/types/Result';
import { ApiErrors, type AuthenticationError } from '$lib/types/ApiError';

export function generateAuthHeader(): Result<string, AuthenticationError> {
	let authUser = '';
	let authPass = '';

	if (typeof localStorage !== 'undefined') {
		authUser = localStorage.getItem('authUser') || '';
		authPass = localStorage.getItem('authPass') || '';
	}

	if (!authUser || !authPass) {
		return err(ApiErrors.authentication('Missing authentication credentials'));
	}

	const credentials = btoa(`${authUser}:${authPass}`);
	return ok(`Basic ${credentials}`);
}

export function getStoredCredentials(): { username: string; password: string } | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	const username = localStorage.getItem('authUser');
	const password = localStorage.getItem('authPass');

	if (!username || !password) {
		return null;
	}

	return { username, password };
}

export function storeCredentials(username: string, password: string): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('authUser', username);
		localStorage.setItem('authPass', password);
	}
}

export function clearCredentials(): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem('authUser');
		localStorage.removeItem('authPass');
	}
}
