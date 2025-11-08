import { env } from '$env/dynamic/private';

const validUsers = env.USERS ? env.USERS.split(',') : [];
const validPasswords = env.PASSWORDS ? env.PASSWORDS.split(',') : [];

/**
 * Simple HTTP Basic Authentication check.
 * Throws a Response if auth fails (SvelteKit style).
 */
export function requireBasicAuth(request: Request): void {
	const authHeader = request.headers.get('authorization');
	if (!authHeader || !authHeader.startsWith('Basic ')) {
		throw new Response('Authentication required', {
			status: 401,
			headers: {
				'WWW-Authenticate': 'Basic realm="Secure Area"'
			}
		});
	}

	const base64Credentials = authHeader.split(' ')[1];
	const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
	const [username, password] = credentials.split(':');

	const isAuthorized = validUsers.some(
		(user, index) => user === username && validPasswords[index] === password
	);
	
	if (!isAuthorized) {
		throwUnauthorized();
	}
}

function throwUnauthorized(): never {
	throw new Response('Authentication required', {
		status: 401,
		headers: {
			'WWW-Authenticate': 'Basic realm="Secure Area"'
		}
	});
}
