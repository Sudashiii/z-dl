export interface RatedBook {
	id: number;
	title: string;
	author: string | null;
	cover: string | null;
	extension: string | null;
	rating: number;
}
