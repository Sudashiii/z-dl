export interface MenuItem {
	id: string;
	label: string;
	href: string;
	icon?: string;
}

export const menuItems: MenuItem[] = [
	{
		id: 'zlib-search',
		label: 'Z-Library',
		href: '/search',
		icon: 'search'
	},
	{
		id: 'library',
		label: 'Library',
		href: '/library',
		icon: 'library'
	},
	{
		id: 'queue',
		label: 'Queue',
		href: '/queue',
		icon: 'queue'
	}
];
