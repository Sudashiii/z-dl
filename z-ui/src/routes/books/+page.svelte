<script lang="ts">
	import type { ZBook } from '$lib/types/ZLibrary/ZBook';
	import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
	import type { ApiError } from '$lib/types/ApiError';
	import DropDown from '$lib/components/DropDown.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import BookCard from '$lib/components/BookCard.svelte';
	import { ZUI } from '$lib/client/zui';

	let title = $state('');
	let lang = $state('german');
	let format = $state('epub');
	let books = $state<ZBook[]>([]);
	let isLoading = $state(false);
	let error = $state<ApiError | null>(null);

	async function searchBooks() {
		if (!title.trim()) return;

		isLoading = true;
		error = null;

		const payload: ZSearchBookRequest = {
			searchText: title,
			languages: [lang],
			extensions: [format]
		};

		const result = await ZUI.searchBook(payload);

		if (result.ok) {
			books = result.value.books;
		} else {
			error = result.error;
			books = [];
		}

		isLoading = false;
	}

	async function handleDownload(book: ZBook) {
		const result = await ZUI.downloadBook(book);
		if (!result.ok) {
			error = result.error;
		}
	}

	async function handleShare(book: ZBook) {
		const result = await ZUI.downloadBook(book);
		if (!result.ok) {
			error = result.error;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			searchBooks();
		}
	}
</script>

<main class="books">
	<Loading bind:show={isLoading} />

	<div class="search">
		<div class="search-bar">
			<input
				type="text"
				placeholder="Search for Books"
				bind:value={title}
				onkeydown={handleKeyDown}
			/>
		</div>

		<div class="search-options">
			<DropDown bind:selected={lang} options={['english', 'german', 'french', 'spanish']} />
			<DropDown bind:selected={format} options={['epub', 'mobi', 'pdf']} />
		</div>
	</div>

	{#if error}
		<div class="error">
			<p>{error.message}</p>
		</div>
	{/if}

	<div class="book-list">
		{#if books.length > 0}
			{#each books as book (book.id)}
				<BookCard {book} onDownload={handleDownload} onShare={handleShare} />
			{/each}
		{:else if !isLoading && title}
			<p>No books found.</p>
		{/if}
	</div>
</main>

<style>
	.books {
		padding: 2rem;
		color: #fff;
		min-height: 100vh;
		font-family: system-ui, sans-serif;
	}

	.search {
		display: flex;
		flex-wrap: wrap;
		margin-bottom: 2rem;
		flex-direction: column;
		gap: 2rem;
	}

	input {
		padding: 0.6rem 0.8rem;
		border-radius: 0.5rem;
		border: none;
		background-color: rgb(39, 54, 71);
		color: #fff;
		font-size: 0.95rem;
		width: inherit;
	}

	.search-bar {
		width: 100%;
	}

	.search-bar input {
		padding-block: 1rem;
		padding-inline: 1.6rem;
		box-sizing: border-box;
	}

	.search-options {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	input:focus {
		outline: none;
		border-color: #8b5cf6;
	}

	.book-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.error {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.5);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
		color: #fca5a5;
	}
</style>
