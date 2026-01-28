export const ZUIRoutes = {
	searchBook: '/zlibrary/search',
	passwordLogin: '/zlibrary/passwordLogin',
	tokenLogin: '/zlibrary/login',
	downloadBook: '/zlibrary/download',
	authCheck: '/auth-check',
	library: '/library/list'
} as const;

export type ZUIRoute = (typeof ZUIRoutes)[keyof typeof ZUIRoutes];
