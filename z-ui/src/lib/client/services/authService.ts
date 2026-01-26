import { type Result, ok, err } from '$lib/types/Result';
import { ApiErrors, type ApiError } from '$lib/types/ApiError';
import { storeCredentials, clearCredentials, getStoredCredentials } from '../base/authHeader';

const API_URL = '/api';

export interface AuthCredentials {
	username: string;
	password: string;
}

/**
 * Service for handling Basic authentication operations.
 */
export const AuthService = {
	/**
	 * Validates credentials against the auth-check endpoint.
	 */
	async validateCredentials(credentials: AuthCredentials): Promise<Result<void, ApiError>> {
		const { username, password } = credentials;

		if (!username || !password) {
			return err(ApiErrors.validation('Username and password are required'));
		}

		const encodedCredentials = btoa(`${username}:${password}`);

		try {
			const response = await fetch(`${API_URL}/auth-check`, {
				headers: { Authorization: `Basic ${encodedCredentials}` }
			});

			if (response.ok) {
				storeCredentials(username, password);
				return ok(undefined);
			}

			clearCredentials();
			return err(await ApiErrors.fromResponse(response));
		} catch {
			clearCredentials();
			return err(ApiErrors.network('Failed to connect to authentication server'));
		}
	},

	/**
	 * Attempts to restore a session from stored credentials.
	 */
	async restoreSession(): Promise<Result<AuthCredentials, ApiError>> {
		const stored = getStoredCredentials();

		if (!stored) {
			return err(ApiErrors.authentication('No stored credentials'));
		}

		const result = await this.validateCredentials(stored);

		if (result.ok) {
			return ok(stored);
		}

		return err(result.error);
	},

	/**
	 * Clears stored authentication credentials.
	 */
	logout(): void {
		clearCredentials();
	},

	/**
	 * Checks if credentials are stored.
	 */
	hasStoredCredentials(): boolean {
		return getStoredCredentials() !== null;
	}
} as const;
