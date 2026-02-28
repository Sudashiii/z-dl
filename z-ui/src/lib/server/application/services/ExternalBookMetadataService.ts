import { env } from '$env/dynamic/private';

export interface ExternalBookMetadata {
	googleBooksId: string | null;
	openLibraryKey: string | null;
	amazonAsin: string | null;
	cover: string | null;
	description: string | null;
	publisher: string | null;
	series: string | null;
	volume: string | null;
	edition: string | null;
	identifier: string | null;
	pages: number | null;
	externalRating: number | null;
	externalRatingCount: number | null;
}

interface LookupInput {
	title: string;
	author: string | null;
	identifier: string | null;
}

function asString(value: unknown): string | null {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function pickFirst<T>(...values: Array<T | null | undefined>): T | null {
	for (const value of values) {
		if (value !== null && value !== undefined) {
			return value;
		}
	}
	return null;
}

function normalizeForMatch(value: string | null | undefined): string {
	if (!value) {
		return '';
	}

	return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export class ExternalBookMetadataService {
	async lookup(input: LookupInput): Promise<ExternalBookMetadata> {
		const [google, openLibrary] = await Promise.all([
			this.lookupGoogleBooks(input),
			this.lookupOpenLibrary(input)
		]);

		// Amazon Product Advertising API is optional and requires signed requests + eligible account.
		// Keep this as a placeholder source id for manual edits/imports.
		const amazonAsin = this.extractAmazonAsin(input.identifier);

		return {
			googleBooksId: google.id,
			openLibraryKey: openLibrary.key,
			amazonAsin,
			cover: pickFirst(google.cover, openLibrary.cover),
			description: pickFirst(google.description, openLibrary.description),
			publisher: pickFirst(google.publisher, openLibrary.publisher),
			series: pickFirst(google.series, openLibrary.series),
			volume: pickFirst(google.volume, openLibrary.volume),
			edition: pickFirst(google.edition, openLibrary.edition),
			identifier: pickFirst(google.identifier, openLibrary.identifier, input.identifier),
			pages: pickFirst(google.pages, openLibrary.pages),
			externalRating: pickFirst(google.externalRating, openLibrary.externalRating),
			externalRatingCount: pickFirst(google.externalRatingCount, openLibrary.externalRatingCount)
		};
	}

	private async lookupGoogleBooks(input: LookupInput): Promise<{
		id: string | null;
		cover: string | null;
		description: string | null;
		publisher: string | null;
		series: string | null;
		volume: string | null;
		edition: string | null;
		identifier: string | null;
		pages: number | null;
		externalRating: number | null;
		externalRatingCount: number | null;
	}> {
		const queryParts = [`intitle:${input.title}`];
		if (input.author) {
			queryParts.push(`inauthor:${input.author}`);
		}
		if (input.identifier) {
			queryParts.push(`isbn:${input.identifier}`);
		}
		const query = encodeURIComponent(queryParts.join(' '));
		const keyPart = env.GOOGLE_BOOKS_API_KEY ? `&key=${encodeURIComponent(env.GOOGLE_BOOKS_API_KEY)}` : '';
		const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5${keyPart}`;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				return this.emptyGoogle();
			}

			const payload = (await response.json()) as {
				items?: Array<{
					id?: string;
					volumeInfo?: {
						title?: string;
						subtitle?: string;
						authors?: string[];
						publisher?: string;
						description?: string;
						pageCount?: number;
						averageRating?: number;
						ratingsCount?: number;
						imageLinks?: { thumbnail?: string; smallThumbnail?: string };
						industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
					};
				}>;
			};

			const items = payload.items ?? [];
			if (items.length === 0) {
				return this.emptyGoogle();
			}

			const normalizedTitle = normalizeForMatch(input.title);
			const normalizedAuthor = normalizeForMatch(input.author);
			const scoreGoogleItem = (item: (typeof items)[number]): number => {
				const title = normalizeForMatch(item.volumeInfo?.title);
				const authors = item.volumeInfo?.authors ?? [];
				const hasTitleMatch = normalizedTitle.length > 0 && title.includes(normalizedTitle);
				const hasAuthorMatch =
					normalizedAuthor.length > 0 &&
					authors.some((author) => normalizeForMatch(author).includes(normalizedAuthor));
				const pages = asNumber(item.volumeInfo?.pageCount);
				return (hasTitleMatch ? 5 : 0) + (hasAuthorMatch ? 3 : 0) + (pages ? 2 : 0);
			};

			const best = [...items].sort((a, b) => scoreGoogleItem(b) - scoreGoogleItem(a))[0] ?? items[0];
			const pageSource = items.find((item) => asNumber(item.volumeInfo?.pageCount) !== null) ?? best;

			const identifiers = best.volumeInfo?.industryIdentifiers ?? [];
			const isbn13 = identifiers.find((item) => item.type === 'ISBN_13')?.identifier;
			const isbn10 = identifiers.find((item) => item.type === 'ISBN_10')?.identifier;
			return {
				id: asString(best.id),
				cover:
					asString(best.volumeInfo?.imageLinks?.thumbnail) ??
					asString(best.volumeInfo?.imageLinks?.smallThumbnail),
				description: asString(best.volumeInfo?.description),
				publisher: asString(best.volumeInfo?.publisher),
				series: null,
				volume: null,
				edition: asString(best.volumeInfo?.subtitle),
				identifier: asString(isbn13) ?? asString(isbn10),
				pages: asNumber(pageSource.volumeInfo?.pageCount),
				externalRating: asNumber(best.volumeInfo?.averageRating),
				externalRatingCount: asNumber(best.volumeInfo?.ratingsCount)
			};
		} catch {
			return this.emptyGoogle();
		}
	}

	private emptyGoogle() {
		return {
			id: null,
			cover: null,
			description: null,
			publisher: null,
			series: null,
			volume: null,
			edition: null,
			identifier: null,
			pages: null,
			externalRating: null,
			externalRatingCount: null
		};
	}

	private async lookupOpenLibrary(input: LookupInput): Promise<{
		key: string | null;
		cover: string | null;
		description: string | null;
		publisher: string | null;
		series: string | null;
		volume: string | null;
		edition: string | null;
		identifier: string | null;
		pages: number | null;
		externalRating: number | null;
		externalRatingCount: number | null;
	}> {
		const query = encodeURIComponent(`${input.title}${input.author ? ` ${input.author}` : ''}`.trim());
		const url =
			`https://openlibrary.org/search.json?q=${query}&limit=5&fields=key,title,author_name,cover_i,isbn,publisher,first_sentence,ratings_average,ratings_count,number_of_pages_median`;
		try {
			const response = await fetch(url);
			if (!response.ok) {
				return this.emptyOpenLibrary();
			}

			const payload = (await response.json()) as {
				docs?: Array<{
					key?: string;
					title?: string;
					author_name?: string[];
					cover_i?: number;
					isbn?: string[];
					publisher?: string[];
					first_sentence?: string | { value?: string };
					ratings_average?: number;
					ratings_count?: number;
					number_of_pages_median?: number;
				}>;
			};
			const docs = payload.docs ?? [];
			if (docs.length === 0) {
				return this.emptyOpenLibrary();
			}

			const normalizedTitle = normalizeForMatch(input.title);
			const normalizedAuthor = normalizeForMatch(input.author);
			const scoreOpenLibraryDoc = (doc: (typeof docs)[number]): number => {
				const title = normalizeForMatch(doc.title);
				const authors = doc.author_name ?? [];
				const hasTitleMatch = normalizedTitle.length > 0 && title.includes(normalizedTitle);
				const hasAuthorMatch =
					normalizedAuthor.length > 0 &&
					authors.some((author) => normalizeForMatch(author).includes(normalizedAuthor));
				const pages = asNumber(doc.number_of_pages_median);
				return (hasTitleMatch ? 5 : 0) + (hasAuthorMatch ? 3 : 0) + (pages ? 2 : 0);
			};

			const best = [...docs].sort((a, b) => scoreOpenLibraryDoc(b) - scoreOpenLibraryDoc(a))[0] ?? docs[0];
			const pageSource = docs.find((doc) => asNumber(doc.number_of_pages_median) !== null) ?? best;

			const firstSentence =
				typeof best.first_sentence === 'string'
					? best.first_sentence
					: asString(best.first_sentence?.value);

			return {
				key: asString(best.key),
				cover: typeof best.cover_i === 'number'
					? `https://covers.openlibrary.org/b/id/${best.cover_i}-L.jpg`
					: null,
				description: asString(firstSentence),
				publisher: asString(best.publisher?.[0]),
				series: null,
				volume: null,
				edition: null,
				identifier: asString(best.isbn?.[0]),
				pages: asNumber(pageSource.number_of_pages_median),
				externalRating: asNumber(best.ratings_average),
				externalRatingCount: asNumber(best.ratings_count)
			};
		} catch {
			return this.emptyOpenLibrary();
		}
	}

	private emptyOpenLibrary() {
		return {
			key: null,
			cover: null,
			description: null,
			publisher: null,
			series: null,
			volume: null,
			edition: null,
			identifier: null,
			pages: null,
			externalRating: null,
			externalRatingCount: null
		};
	}

	private extractAmazonAsin(identifier: string | null): string | null {
		if (!identifier) {
			return null;
		}

		const trimmed = identifier.trim();
		// Basic ASIN shape fallback for manual metadata pipelines.
		if (/^[A-Z0-9]{10}$/i.test(trimmed)) {
			return trimmed.toUpperCase();
		}
		return null;
	}
}
