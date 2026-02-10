const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as const;

export interface ApiRouteEntry {
	path: string;
	methods: string[];
}

type RouteModule = Record<string, unknown>;

function filePathToApiPath(filePath: string): string {
	const routePart = filePath
		.replace('/src/routes/api', '')
		.replace('/+server.ts', '');

	return routePart.length > 0 ? `/api${routePart}` : '/api';
}

export function getApiRouteCatalog(): ApiRouteEntry[] {
	const modules = import.meta.glob('/src/routes/api/**/+server.ts', { eager: true });
	const routes: ApiRouteEntry[] = [];

	for (const [filePath, moduleExports] of Object.entries(modules)) {
		const mod = moduleExports as RouteModule;
		const methods = HTTP_METHODS.filter((method) => typeof mod[method] === 'function');

		routes.push({
			path: filePathToApiPath(filePath),
			methods
		});
	}

	return routes.sort((a, b) => a.path.localeCompare(b.path));
}
