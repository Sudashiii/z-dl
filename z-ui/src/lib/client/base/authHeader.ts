export function generateAuthHeader(){
		let authUser = '';
		let authPass = '';

		if (typeof localStorage !== 'undefined') {
			authUser = localStorage.getItem('authUser') || '';
			authPass = localStorage.getItem('authPass') || '';
		}

		if (!authUser || !authPass) {
			throw new Error('Missing authentication credentials.');
		}

		const credentials = btoa(`${authUser}:${authPass}`);

        return `Basic ${credentials}`
}