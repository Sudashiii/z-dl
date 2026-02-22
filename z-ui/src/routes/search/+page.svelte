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
	let showTitleAdjustModal = $state(false);
	let pendingBookAction = $state<"download" | "library" | null>(null);
	let pendingBook = $state<ZBook | null>(null);
	let adjustedTitle = $state("");

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

	function openTitleAdjustModal(book: ZBook, action: "download" | "library"): void {
		pendingBook = book;
		pendingBookAction = action;
		adjustedTitle = book.title;
		showTitleAdjustModal = true;
	}

	function closeTitleAdjustModal(): void {
		showTitleAdjustModal = false;
		pendingBook = null;
		pendingBookAction = null;
		adjustedTitle = "";
	}

	async function confirmTitleAdjustAction(): Promise<void> {
		if (!pendingBook || !pendingBookAction) {
			return;
		}

		const finalTitle = adjustedTitle.trim();
		if (!finalTitle) {
			toastStore.add("Title cannot be empty", "error");
			return;
		}

		const bookWithAdjustedTitle: ZBook = {
			...pendingBook,
			title: finalTitle
		};
		const action = pendingBookAction;
		closeTitleAdjustModal();

		if (action === "download") {
			await handleDownload(bookWithAdjustedTitle);
			return;
		}

		await handleShare(bookWithAdjustedTitle);
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
				<label for="search-language">Language</label>
				<DropDown
					id="search-language"
					bind:selected={lang}
					options={["english", "german", "french", "spanish"]}
				/>
			</div>
			<div class="filter-group">
				<label for="search-format">Format</label>
				<DropDown
					id="search-format"
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
						onDownload={(selected) => openTitleAdjustModal(selected, "download")}
						onShare={(selected) => openTitleAdjustModal(selected, "library")}
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

{#if showTitleAdjustModal && pendingBook}
	<div
		class="title-adjust-modal-overlay"
		role="button"
		tabindex="0"
		aria-label="Close title adjustment modal"
		onclick={closeTitleAdjustModal}
		onkeydown={(event) => event.key === "Escape" && closeTitleAdjustModal()}
	>
		<div
			class="title-adjust-modal-content"
			role="dialog"
			aria-modal="true"
			aria-labelledby="title-adjust-heading"
			tabindex="-1"
			onclick={(event) => event.stopPropagation()}
			onkeydown={(event) => event.stopPropagation()}
		>
			<h3 id="title-adjust-heading">Adjust Book Title</h3>
			<p class="title-adjust-description">
				This title will be used for the filename and reader metadata.
			</p>
			<label class="title-adjust-label" for="adjusted-book-title">Title</label>
			<input
				id="adjusted-book-title"
				type="text"
				bind:value={adjustedTitle}
				placeholder="Book title"
			/>
			<div class="title-adjust-actions">
				<button type="button" class="title-adjust-cancel" onclick={closeTitleAdjustModal}>
					Cancel
				</button>
				<button
					type="button"
					class="title-adjust-confirm"
					onclick={confirmTitleAdjustAction}
				>
					{pendingBookAction === "download" ? "Download" : "Add To Library"}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.search-page {
		padding: 2rem 0;
		color: var(--color-text-primary);
	}

	.title-adjust-modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(1, 6, 14, 0.72);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
	}

	.title-adjust-modal-content {
		width: min(520px, 92vw);
		background: linear-gradient(160deg, rgba(17, 37, 58, 0.95), rgba(11, 25, 40, 0.95));
		border: 1px solid rgba(160, 194, 226, 0.24);
		border-radius: 1rem;
		padding: 1.25rem;
		box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.5);
	}

	.title-adjust-modal-content h3 {
		margin: 0;
		font-size: 1.15rem;
		color: rgba(236, 245, 255, 0.95);
	}

	.title-adjust-description {
		margin: 0.45rem 0 1rem;
		font-size: 0.88rem;
		color: rgba(214, 232, 252, 0.74);
	}

	.title-adjust-label {
		display: block;
		font-size: 0.8rem;
		color: rgba(214, 232, 252, 0.78);
		margin-bottom: 0.35rem;
	}

	.title-adjust-modal-content input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.7rem 0.85rem;
		background: rgba(9, 22, 37, 0.78);
		border: 1px solid rgba(160, 194, 226, 0.24);
		border-radius: 0.65rem;
		color: rgba(236, 245, 255, 0.95);
		font-size: 0.95rem;
	}

	.title-adjust-modal-content input:focus {
		outline: none;
		border-color: rgba(120, 196, 255, 0.72);
		box-shadow: 0 0 0 3px rgba(61, 162, 255, 0.22);
	}

	.title-adjust-actions {
		margin-top: 1rem;
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
	}

	.title-adjust-cancel {
		padding: 0.55rem 0.9rem;
		background: rgba(12, 28, 44, 0.76);
		border: 1px solid rgba(167, 203, 237, 0.26);
		border-radius: 0.55rem;
		color: rgba(228, 240, 255, 0.85);
		cursor: pointer;
	}

	.title-adjust-confirm {
		padding: 0.55rem 0.9rem;
		background: linear-gradient(135deg, #2f8be9, #4ea7ff);
		border: 1px solid rgba(124, 193, 255, 0.38);
		border-radius: 0.55rem;
		color: #f6fbff;
		cursor: pointer;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.9rem;
		font-weight: 600;
	}

	.page-header p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.98rem;
	}

	.search-container {
		background: linear-gradient(160deg, rgba(17, 37, 58, 0.82), rgba(11, 25, 40, 0.78));
		border: 1px solid rgba(160, 194, 226, 0.2);
		border-radius: 1.15rem;
		padding: 1.4rem;
		margin-bottom: 2rem;
		box-shadow: inset 0 1px 0 rgba(210, 230, 252, 0.04);
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(9, 22, 37, 0.78);
		border: 1px solid rgba(160, 194, 226, 0.22);
		border-radius: 0.86rem;
		padding: 0.5rem 0.75rem 0.5rem 1rem;
		transition: all 0.2s ease;
	}

	.search-bar:focus-within {
		border-color: rgba(120, 196, 255, 0.72);
		box-shadow: 0 0 0 3px rgba(61, 162, 255, 0.22);
	}

	.search-icon {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.search-bar:focus-within .search-icon {
		color: var(--color-accent);
	}

	.search-bar input {
		flex: 1;
		padding: 0.75rem 0;
		border: none;
		background: transparent;
		color: var(--color-text-primary);
		font-size: 1rem;
	}

	.search-bar input::placeholder {
		color: var(--color-text-muted);
	}

	.search-bar input:focus {
		outline: none;
	}

	.search-btn {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #2f8be9, #4ea7ff);
		border: 1px solid rgba(124, 193, 255, 0.4);
		border-radius: 0.65rem;
		color: #f6fbff;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.search-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #3c96f2, #66b8ff);
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
		border-top: 1px solid rgba(160, 194, 226, 0.16);
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.filter-group label {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.results-header {
		margin-bottom: 1rem;
	}

	.results-count {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
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
		background: rgba(11, 25, 40, 0.55);
		border: 1px dashed rgba(160, 194, 226, 0.2);
		border-radius: 1rem;
		text-align: center;
		color: var(--color-text-muted);
	}

	.empty-state.initial {
		color: var(--color-text-secondary);
	}

	.empty-state.initial svg {
		color: var(--color-accent);
		opacity: 0.6;
	}

	.empty-state svg {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		color: rgba(232, 243, 255, 0.9);
	}

	.empty-state p {
		margin: 0;
		font-size: 0.9rem;
	}

	.error {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(121, 38, 48, 0.44);
		border: 1px solid rgba(239, 116, 126, 0.38);
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		margin-bottom: 1.5rem;
		color: #ffb5be;
	}

	.error svg {
		flex-shrink: 0;
	}

	.error p {
		margin: 0;
	}

	@media (max-width: 900px) {
		.search-page {
			padding: 1.25rem 0 1.5rem;
		}

		.search-container {
			padding: 1rem;
		}
	}

	@media (max-width: 600px) {
		.page-header h1 {
			font-size: 1.45rem;
		}

		.page-header p {
			font-size: 0.9rem;
		}

		.search-bar {
			flex-wrap: wrap;
			padding: 0.5rem 0.65rem;
		}

		.search-bar input {
			width: 100%;
			font-size: 0.95rem;
		}

		.search-btn {
			width: 100%;
			margin-top: 0.5rem;
			padding: 0.7rem 1rem;
		}

		.search-filters {
			flex-direction: column;
			gap: 1rem;
		}

		.filter-group {
			justify-content: space-between;
			width: 100%;
		}

		.empty-state {
			padding: 2.5rem 1rem;
		}

		.download-modal {
			margin: 0 1rem;
			padding: 1.4rem;
			gap: 1.2rem;
			max-width: 100%;
		}

		.download-title {
			max-width: 100%;
		}
	}

	@media (max-width: 420px) {
		.search-container {
			padding: 0.85rem;
			border-radius: 0.8rem;
		}

		.search-bar input::placeholder {
			font-size: 0.9rem;
		}

		.error {
			padding: 0.85rem 0.9rem;
			font-size: 0.85rem;
		}
	}

	/* Download Overlay */
	.download-overlay {
		position: fixed;
		inset: 0;
		background: rgba(2, 9, 18, 0.88);
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
		background: linear-gradient(160deg, rgba(16, 34, 53, 0.92), rgba(11, 25, 40, 0.92));
		border: 1px solid rgba(160, 194, 226, 0.24);
		border-radius: 1.5rem;
		box-shadow: 0 25px 50px -20px rgba(0, 0, 0, 0.75);
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
		border: 4px solid rgba(61, 162, 255, 0.24);
		border-top-color: var(--color-accent);
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
		color: #8dcfff;
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
