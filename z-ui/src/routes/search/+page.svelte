<script lang="ts">
	import type { ZBook } from "$lib/types/ZLibrary/ZBook";
	import type { ZSearchBookRequest } from "$lib/types/ZLibrary/Requests/ZSearchBookRequest";
	import type { ApiError } from "$lib/types/ApiError";
	import DropDown from "$lib/components/DropDown.svelte";
	import Loading from "$lib/components/Loading.svelte";
	import BookCard from "$lib/components/BookCard.svelte";
	import { ZUI } from "$lib/client/zui";

	import { toastStore } from "$lib/client/stores/toastStore.svelte";

	let title = $state("");
	let lang = $state("german");
	let format = $state("epub");
	let books = $state<ZBook[]>([]);
	let isLoading = $state(false);
	let isDownloading = $state(false);
	let downloadingBook = $state<string | null>(null);
	let error = $state<ApiError | null>(null);

	async function searchBooks() {
		if (!title.trim()) return;

		isLoading = true;
		error = null;

		const payload: ZSearchBookRequest = {
			searchText: title,
			languages: [lang],
			extensions: [format],
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
		isDownloading = true;
		downloadingBook = book.title;
		
		const result = await ZUI.downloadBook(book, { downloadToDevice: true });
		
		isDownloading = false;
		downloadingBook = null;
		
		if (!result.ok) {
			error = result.error;
			toastStore.add(`Download failed: ${result.error.message}`, "error");
		} else {
			toastStore.add(`Download started for "${book.title}"`, "success");
		}
	}

	async function handleShare(book: ZBook) {
		// Queue the book for async download to library - returns immediately
		const result = await ZUI.queueToLibrary(book);
		
		if (!result.ok) {
			error = result.error;
			toastStore.add(
				`Failed to add to library: ${result.error.message}`,
				"error",
			);
		} else {
			const queueInfo = result.value.queueStatus.pending > 0 
				? ` (${result.value.queueStatus.pending} in queue)`
				: '';
			toastStore.add(`"${book.title}" added to download queue${queueInfo}`, "success");
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter") {
			searchBooks();
		}
	}
</script>

<div class="search-page">
	<Loading bind:show={isLoading} />

	{#if isDownloading}
		<div class="download-overlay">
			<div class="download-modal">
				<div class="download-spinner"></div>
				<div class="download-content">
					<h3>Downloading...</h3>
					{#if downloadingBook}
						<p class="download-title">{downloadingBook}</p>
					{/if}
					<p class="download-hint">Please wait while we fetch your book</p>
				</div>
			</div>
		</div>
	{/if}

	<header class="page-header">
		<h1>Search Books</h1>
		<p>Find and download books from Z-Library</p>
	</header>

	<div class="search-container">
		<div class="search-bar">
			<svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="11" cy="11" r="8"></circle>
				<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
			</svg>
			<input
				type="text"
				placeholder="Search by title, author, or ISBN..."
				bind:value={title}
				onkeydown={handleKeyDown}
			/>
			<button class="search-btn" onclick={searchBooks} disabled={!title.trim()}>
				Search
			</button>
		</div>

		<div class="search-filters">
			<div class="filter-group">
				<label>Language</label>
				<DropDown
					bind:selected={lang}
					options={["english", "german", "french", "spanish"]}
				/>
			</div>
			<div class="filter-group">
				<label>Format</label>
				<DropDown
					bind:selected={format}
					options={["epub", "mobi", "pdf"]}
				/>
			</div>
		</div>
	</div>

	{#if error}
		<div class="error">
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="12" y1="8" x2="12" y2="12"></line>
				<line x1="12" y1="16" x2="12.01" y2="16"></line>
			</svg>
			<p>{error.message}</p>
		</div>
	{/if}

	<div class="results">
		{#if books.length > 0}
			<div class="results-header">
				<span class="results-count">{books.length} result{books.length !== 1 ? 's' : ''} found</span>
			</div>
			<div class="book-list">
				{#each books as book (book.id)}
					<BookCard
						{book}
						onDownload={handleDownload}
						onShare={handleShare}
					/>
				{/each}
			</div>
		{:else if !isLoading && title}
			<div class="empty-state">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					<line x1="8" y1="11" x2="14" y2="11"></line>
				</svg>
				<h3>No books found</h3>
				<p>Try adjusting your search terms or filters</p>
			</div>
		{:else if !isLoading}
			<div class="empty-state initial">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
					<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
				</svg>
				<h3>Search for books</h3>
				<p>Enter a title, author, or ISBN to get started</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.search-page {
		padding: 2rem 0;
		color: #fff;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		font-weight: 600;
	}

	.page-header p {
		margin: 0;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.95rem;
	}

	.search-container {
		background: rgba(28, 38, 50, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(15, 23, 32, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		padding: 0.5rem 0.75rem 0.5rem 1rem;
		transition: all 0.2s ease;
	}

	.search-bar:focus-within {
		border-color: #1e90ff;
		box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.15);
	}

	.search-icon {
		color: rgba(255, 255, 255, 0.4);
		flex-shrink: 0;
	}

	.search-bar:focus-within .search-icon {
		color: #1e90ff;
	}

	.search-bar input {
		flex: 1;
		padding: 0.75rem 0;
		border: none;
		background: transparent;
		color: #fff;
		font-size: 1rem;
	}

	.search-bar input::placeholder {
		color: rgba(255, 255, 255, 0.35);
	}

	.search-bar input:focus {
		outline: none;
	}

	.search-btn {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #1e90ff, #0066cc);
		border: none;
		border-radius: 0.5rem;
		color: #fff;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.search-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #3ba0ff, #0077ee);
		transform: translateY(-1px);
	}

	.search-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.search-filters {
		display: flex;
		gap: 1.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.filter-group label {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 500;
	}

	.results-header {
		margin-bottom: 1rem;
	}

	.results-count {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.book-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		background: rgba(28, 38, 50, 0.4);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		text-align: center;
		color: rgba(255, 255, 255, 0.4);
	}

	.empty-state.initial {
		color: rgba(255, 255, 255, 0.5);
	}

	.empty-state.initial svg {
		color: #1e90ff;
		opacity: 0.6;
	}

	.empty-state svg {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.empty-state p {
		margin: 0;
		font-size: 0.9rem;
	}

	.error {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		margin-bottom: 1.5rem;
		color: #fca5a5;
	}

	.error svg {
		flex-shrink: 0;
	}

	.error p {
		margin: 0;
	}

	@media (max-width: 600px) {
		.search-bar {
			flex-wrap: wrap;
		}

		.search-bar input {
			width: 100%;
		}

		.search-btn {
			width: 100%;
			margin-top: 0.5rem;
		}

		.search-filters {
			flex-direction: column;
			gap: 1rem;
		}
	}

	/* Download Overlay */
	.download-overlay {
		position: fixed;
		inset: 0;
		background: rgba(15, 20, 25, 0.9);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.download-modal {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		padding: 3rem;
		background: rgba(28, 38, 50, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		max-width: 400px;
		text-align: center;
		animation: slideUp 0.4s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.download-spinner {
		width: 64px;
		height: 64px;
		border: 4px solid rgba(30, 144, 255, 0.2);
		border-top-color: #1e90ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.download-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.download-content h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #fff;
	}

	.download-title {
		margin: 0;
		font-size: 0.95rem;
		color: #1e90ff;
		font-weight: 500;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.download-hint {
		margin: 0;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.5);
	}
</style>
