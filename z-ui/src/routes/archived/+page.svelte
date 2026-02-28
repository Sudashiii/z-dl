<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import Loading from "$lib/components/Loading.svelte";
	import { ZUI } from "$lib/client/zui";
	import { toastStore } from "$lib/client/stores/toastStore.svelte";
	import type { ApiError } from "$lib/types/ApiError";
	import type { LibraryBook } from "$lib/types/Library/Book";

	type BookStatus = "unread" | "reading" | "read";

	let isLoading = $state(true);
	let error = $state<ApiError | null>(null);
	let archivedBooks = $state<LibraryBook[]>([]);
	let unarchivingBookId = $state<number | null>(null);

	onMount(() => {
		void loadArchived();
	});

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
		toastStore.add(`"${book.title}" restored to library`, "success");
	}

	function openDetailModal(book: LibraryBook): void {
		void goto(`/library?view=archived&openBookId=${book.id}`);
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
					onclick={() => openDetailModal(book)}
					onkeydown={(event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							openDetailModal(book);
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
	}
</style>
