<script lang="ts">
	import { onMount } from "svelte";
	import BookDetailModalShell from "$lib/components/BookDetailModalShell.svelte";
	import Loading from "$lib/components/Loading.svelte";
	import { ZUI } from "$lib/client/zui";
	import { toastStore } from "$lib/client/stores/toastStore.svelte";
	import type { ApiError } from "$lib/types/ApiError";
	import type { LibraryBook } from "$lib/types/Library/Book";
	import type { LibraryBookDetail } from "$lib/types/Library/BookDetail";

	type BookStatus = "unread" | "reading" | "read";

	let isLoading = $state(true);
	let error = $state<ApiError | null>(null);
	let archivedBooks = $state<LibraryBook[]>([]);
	let unarchivingBookId = $state<number | null>(null);
	let selectedBook = $state<LibraryBook | null>(null);
	let selectedBookDetail = $state<LibraryBookDetail | null>(null);
	let showDetailModal = $state(false);
	let isDetailLoading = $state(false);
	let detailError = $state<string | null>(null);

	onMount(() => {
		(async () => {
			await loadArchived();

			const params = new URLSearchParams(window.location.search);
			const openBookIdRaw = params.get("openBookId");
			const openBookId = openBookIdRaw ? Number.parseInt(openBookIdRaw, 10) : NaN;
			if (Number.isNaN(openBookId)) {
				return;
			}

			const candidate = archivedBooks.find((book) => book.id === openBookId);
			if (candidate) {
				await openDetailModal(candidate);
			}
		})();
	});

	function updateArchivedUrl(openBookId?: number | null): void {
		if (typeof window === "undefined") {
			return;
		}

		const params = new URLSearchParams(window.location.search);
		if (typeof openBookId === "number") {
			params.set("openBookId", String(openBookId));
		} else {
			params.delete("openBookId");
		}

		const query = params.toString();
		const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
		window.history.replaceState(window.history.state, "", nextUrl);
	}

	async function loadArchived(): Promise<void> {
		isLoading = true;
		error = null;
		const result = await ZUI.getLibrary();
		if (!result.ok) {
			error = result.error;
			isLoading = false;
			return;
		}

		archivedBooks = result.value.books
			.filter((book) => Boolean(book.archived_at))
			.sort((a, b) => String(b.archived_at ?? "").localeCompare(String(a.archived_at ?? "")));
		isLoading = false;
	}

	function getBookStatus(book: LibraryBook): BookStatus {
		if (book.read_at) return "read";
		const progress = getProgressPercent(book);
		return progress > 0 ? "reading" : "unread";
	}

	function getStatusLabel(status: BookStatus): string {
		if (status === "read") return "Read";
		if (status === "reading") return "Reading";
		return "Unread";
	}

	function getProgressPercent(book: LibraryBook): number {
		if (book.progressPercent === null || book.progressPercent === undefined) {
			return 0;
		}
		return Math.max(0, Math.min(100, Math.round(book.progressPercent)));
	}

	function getFormat(book: LibraryBook): string {
		return (book.extension ?? "EPUB").toUpperCase();
	}

	function formatDate(value: string | null | undefined): string {
		if (!value) return "Unknown";
		return new Date(value).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric"
		});
	}

	function formatFileSize(bytes: number | null | undefined): string {
		if (!bytes || bytes <= 0) return "Unknown size";
		if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${bytes} B`;
	}

	async function handleUnarchive(book: LibraryBook): Promise<void> {
		if (unarchivingBookId !== null) {
			return;
		}

		unarchivingBookId = book.id;
		const result = await ZUI.updateLibraryBookState(book.id, { archived: false });
		unarchivingBookId = null;

		if (!result.ok) {
			toastStore.add(`Failed to restore "${book.title}": ${result.error.message}`, "error");
			return;
		}

		archivedBooks = archivedBooks.filter((candidate) => candidate.id !== book.id);
		if (selectedBook?.id === book.id) {
			closeDetailModal();
		}
		toastStore.add(`"${book.title}" restored to library`, "success");
	}

	function clampProgress(value: number | null | undefined): number {
		if (value === null || value === undefined || Number.isNaN(value)) {
			return 0;
		}
		return Math.max(0, Math.min(100, value));
	}

	async function openDetailModal(book: LibraryBook): Promise<void> {
		selectedBook = book;
		selectedBookDetail = null;
		detailError = null;
		showDetailModal = true;
		isDetailLoading = true;
		updateArchivedUrl(book.id);

		const result = await ZUI.getLibraryBookDetail(book.id);
		isDetailLoading = false;

		if (!result.ok) {
			detailError = result.error.message;
			return;
		}

		selectedBookDetail = result.value;
	}

	function closeDetailModal(): void {
		showDetailModal = false;
		selectedBook = null;
		selectedBookDetail = null;
		detailError = null;
		isDetailLoading = false;
		updateArchivedUrl(null);
	}
</script>

<div class="archived-page">
	<Loading bind:show={isLoading} />

	{#if error}
		<div class="error-banner">
			<p>{error.message}</p>
			<button onclick={loadArchived}>Retry</button>
		</div>
	{/if}

	<header class="page-header">
		<h2>Archived</h2>
		<p>
			{archivedBooks.length} archived book{archivedBooks.length === 1 ? "" : "s"}. These books are
			hidden from your main library view.
		</p>
	</header>

	{#if !isLoading && archivedBooks.length === 0}
		<div class="empty-state">
			<div class="empty-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="21 8 21 21 3 21 3 8"></polyline>
					<rect x="1" y="3" width="22" height="5"></rect>
					<line x1="10" y1="12" x2="14" y2="12"></line>
				</svg>
			</div>
			<h3>No archived books</h3>
			<p>Books you archive will appear here. Archive books to hide them from your main library without deleting them.</p>
		</div>
	{:else}
		<div class="archived-list">
			{#each archivedBooks as book (book.id)}
				<div
					class="archived-card"
					role="button"
					tabindex="0"
					aria-label={`Show details for ${book.title}`}
					onclick={() => void openDetailModal(book)}
					onkeydown={(event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							void openDetailModal(book);
						}
					}}
				>
					<div class="book-cover-wrap">
						{#if book.cover}
							<img src={book.cover} alt={book.title} loading="lazy" />
						{:else}
							<div class="book-cover-fallback">No cover</div>
						{/if}
					</div>

					<div class="book-main">
						<p class="book-title" title={book.title}>{book.title}</p>
						<p class="book-author">{book.author ?? "Unknown author"}</p>

						<div class="book-tags">
							<span class={`format-badge ${getFormat(book).toLowerCase()}`}>{getFormat(book)}</span>
							<span class={`status-pill ${getBookStatus(book)}`}>{getStatusLabel(getBookStatus(book))}</span>
							<span class="book-size">{formatFileSize(book.filesize)}</span>
							<div class="book-stars" aria-label={`Rating ${book.rating ?? 0} out of 5`}>
								{#each [1, 2, 3, 4, 5] as star}
									<svg class:filled={star <= (book.rating ?? 0)} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
									</svg>
								{/each}
							</div>
						</div>

						<div class="book-submeta">
							<span>Added {formatDate(book.createdAt)}</span>
							{#if getProgressPercent(book) > 0}
								{@const progress = getProgressPercent(book)}
								<div class="mini-progress">
									<div class="mini-progress-track">
										<div class="mini-progress-fill" style={`width: ${progress}%`}></div>
									</div>
									<span>{progress}%</span>
								</div>
							{/if}
						</div>
					</div>

					<div class="card-actions">
						<button
							type="button"
							onclick={(event) => {
								event.stopPropagation();
								void handleUnarchive(book);
							}}
							disabled={unarchivingBookId !== null}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="21 8 21 21 3 21 3 8"></polyline>
								<rect x="1" y="3" width="22" height="5"></rect>
								<line x1="10" y1="12" x2="14" y2="12"></line>
							</svg>
							<span>{unarchivingBookId === book.id ? "Saving..." : "Unarchive"}</span>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showDetailModal && selectedBook}
	<BookDetailModalShell title="Book Details" onClose={closeDetailModal}>
		{#if isDetailLoading}
			<p class="detail-muted">Loading details...</p>
		{:else if detailError}
			<p class="detail-error">{detailError}</p>
		{:else if selectedBookDetail}
			<div class="detail-grid">
				<div>
					<p class="detail-label">Author</p>
					<p>{selectedBookDetail.author || "Unknown author"}</p>
				</div>
				<div>
					<p class="detail-label">Format</p>
					<p>{getFormat(selectedBook)}</p>
				</div>
				<div>
					<p class="detail-label">Size</p>
					<p>{formatFileSize(selectedBook.filesize)}</p>
				</div>
				<div>
					<p class="detail-label">Archived</p>
					<p>{formatDate(selectedBook.archived_at)}</p>
				</div>
				<div>
					<p class="detail-label">Progress</p>
					<div class="detail-progress">
						<div class="detail-progress-track">
							<div class="detail-progress-fill" style={`width: ${clampProgress(selectedBookDetail.progressPercent)}%`}></div>
						</div>
						<span>{clampProgress(selectedBookDetail.progressPercent).toFixed(0)}%</span>
					</div>
				</div>
				<div>
					<p class="detail-label">Downloaded Devices</p>
					<p>{selectedBookDetail.downloadedDevices.length}</p>
				</div>
			</div>

			<div class="detail-actions">
				<button
					type="button"
					class="detail-unarchive"
					onclick={() => selectedBook && void handleUnarchive(selectedBook)}
					disabled={unarchivingBookId !== null}
				>
					{unarchivingBookId === selectedBook.id ? "Saving..." : "Unarchive"}
				</button>
			</div>
		{/if}
	</BookDetailModalShell>
{/if}

<style>
	.archived-page {
		padding: 1.5rem 0;
		display: grid;
		gap: 1.5rem;
		color: var(--color-text-primary);
	}

	.error-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid color-mix(in oklab, var(--color-danger), transparent 80%);
		background: color-mix(in oklab, var(--color-danger), transparent 95%);
		color: var(--color-danger);
	}

	.error-banner p {
		margin: 0;
		font-size: 0.8rem;
	}

	.error-banner button {
		padding: 0.35rem 0.7rem;
		border-radius: 0.5rem;
		border: 1px solid color-mix(in oklab, var(--color-danger), transparent 65%);
		background: transparent;
		color: var(--color-danger);
		font-size: 0.75rem;
		font-family: inherit;
		cursor: pointer;
	}

	.page-header h2 {
		margin: 0;
		font-size: 1.85rem;
		font-weight: 600;
	}

	.page-header p {
		margin: 0.35rem 0 0;
		font-size: 0.92rem;
		color: var(--color-text-muted);
	}

	.archived-list {
		display: grid;
		gap: 0.5rem;
	}

	.archived-card {
		width: 100%;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border);
		background: #161921;
		font-family: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
		transition: border-color 0.15s ease;
	}

	.archived-card:hover {
		border-color: color-mix(in oklab, var(--color-primary), transparent 80%);
	}

	.book-cover-wrap {
		width: 3rem;
		height: 4rem;
		border-radius: 0.5rem;
		overflow: hidden;
		flex-shrink: 0;
		opacity: 0.74;
		background: #111318;
	}

	.book-cover-wrap img,
	.book-cover-fallback {
		width: 100%;
		height: 100%;
	}

	.book-cover-wrap img {
		object-fit: cover;
		display: block;
	}

	.book-cover-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.62rem;
		color: var(--color-text-muted);
	}

	.book-main {
		min-width: 0;
	}

	.book-title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.book-author {
		margin: 0.2rem 0 0;
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	.book-tags {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
		margin-top: 0.52rem;
	}

	.format-badge,
	.status-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.14rem 0.62rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: 0.02em;
	}

	.format-badge.epub {
		background: #1a2a3a;
		color: #60a5fa;
	}

	.format-badge.pdf {
		background: #2a1a2a;
		color: #c084fc;
	}

	.format-badge.mobi {
		background: #2a2518;
		color: #c9a962;
	}

	.status-pill.unread {
		background: #2a2d3a;
		color: #a0aec0;
	}

	.status-pill.reading {
		background: #2a2518;
		color: #c9a962;
	}

	.status-pill.read {
		background: #1a2a1a;
		color: #4ade80;
	}

	.book-size {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.book-stars {
		display: inline-flex;
		align-items: center;
		gap: 0.14rem;
		color: #3a3d4a;
	}

	.book-stars svg {
		fill: transparent;
	}

	.book-stars svg.filled {
		fill: #c9a962;
		color: #c9a962;
	}

	.book-submeta {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		margin-top: 0.58rem;
		font-size: 0.74rem;
		color: var(--color-text-muted);
	}

	.mini-progress {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

	.mini-progress-track {
		width: 6rem;
		height: 0.32rem;
		border-radius: 999px;
		overflow: hidden;
		background: #1e2230;
	}

	.mini-progress-fill {
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, #c9a962, #e0c878);
	}

	.mini-progress span {
		font-size: 0.7rem;
	}

	.card-actions {
		display: flex;
		align-items: center;
	}

	.card-actions button {
		display: inline-flex;
		align-items: center;
		gap: 0.42rem;
		padding: 0.52rem 0.72rem;
		border-radius: 0.5rem;
		border: 0;
		background: #1e2230;
		color: var(--color-text-secondary);
		font-size: 0.8rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.card-actions button:focus {
		outline: none;
	}

	.card-actions button:hover:not(:disabled) {
		background: #242a39;
		color: var(--color-text-primary);
	}

	.card-actions button:disabled {
		opacity: 0.7;
		cursor: default;
	}

	.empty-state {
		padding: 2.4rem 1rem;
		border: 1px dashed var(--color-border);
		border-radius: 0.75rem;
		background: #161921;
		display: grid;
		justify-items: center;
		text-align: center;
	}

	.empty-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 0.95rem;
		background: #1e2230;
		color: var(--color-text-muted);
	}

	.empty-state h3 {
		margin: 0.75rem 0 0;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.empty-state p {
		margin: 0.32rem 0 0;
		max-width: 35rem;
		font-size: 0.84rem;
		color: var(--color-text-muted);
	}

	.detail-muted,
	.detail-error {
		margin: 0;
		font-size: 0.82rem;
		color: var(--color-text-muted);
	}

	.detail-error {
		color: var(--color-danger);
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.7rem;
	}

	.detail-label {
		margin: 0 0 0.2rem;
		font-size: 0.68rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-grid p {
		margin: 0;
		font-size: 0.84rem;
	}

	.detail-progress {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

	.detail-progress-track {
		width: 130px;
		height: 0.38rem;
		background: #1f2433;
		border-radius: 999px;
		overflow: hidden;
	}

	.detail-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #60a5fa, #3b82f6);
		border-radius: inherit;
	}

	.detail-actions {
		display: flex;
		justify-content: flex-end;
	}

	.detail-unarchive {
		padding: 0.48rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(91, 152, 255, 0.32);
		background: rgba(52, 112, 208, 0.2);
		color: #d8e5ff;
		font-size: 0.78rem;
		font-family: inherit;
		cursor: pointer;
	}

	.detail-unarchive:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 900px) {
		.archived-card {
			grid-template-columns: auto 1fr;
		}

		.card-actions {
			grid-column: 1 / -1;
			justify-content: flex-start;
		}
	}

	@media (max-width: 640px) {
		.archived-page {
			padding-top: 1rem;
			gap: 1rem;
		}

		.page-header h2 {
			font-size: 1.5rem;
		}

		.book-submeta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.45rem;
		}

		.detail-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
