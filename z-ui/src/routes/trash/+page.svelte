<script lang="ts">
	import { onMount } from "svelte";
	import Loading from "$lib/components/Loading.svelte";
	import { ZUI } from "$lib/client/zui";
	import { toastStore } from "$lib/client/stores/toastStore.svelte";
	import type { ApiError } from "$lib/types/ApiError";
	import type { LibraryBook } from "$lib/types/Library/Book";

	let isLoading = $state(true);
	let error = $state<ApiError | null>(null);
	let trashBooks = $state<LibraryBook[]>([]);
	let confirmingDeleteBookId = $state<number | null>(null);
	let isConfirmingEmptyAll = $state(false);
	let restoringBookId = $state<number | null>(null);
	let deletingBookId = $state<number | null>(null);
	let emptyingAll = $state(false);

	onMount(() => {
		void loadTrash();
	});

	async function loadTrash(): Promise<void> {
		isLoading = true;
		error = null;
		const result = await ZUI.getLibraryTrash();
		if (!result.ok) {
			error = result.error;
			isLoading = false;
			return;
		}

		trashBooks = result.value.books.sort((a, b) => String(b.deleted_at ?? "").localeCompare(String(a.deleted_at ?? "")));
		isLoading = false;
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

	function getFormat(book: LibraryBook): string {
		return (book.extension ?? "EPUB").toUpperCase();
	}

	function getDaysUntilDeletion(value: string | null | undefined): number | null {
		if (!value) return null;
		const now = new Date();
		const target = new Date(value);
		if (Number.isNaN(target.getTime())) return null;
		const diff = target.getTime() - now.getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	}

	async function handleRestore(book: LibraryBook): Promise<void> {
		if (restoringBookId !== null || deletingBookId !== null || emptyingAll) {
			return;
		}

		restoringBookId = book.id;
		const result = await ZUI.restoreLibraryBook(book.id);
		restoringBookId = null;

		if (!result.ok) {
			toastStore.add(`Failed to restore "${book.title}": ${result.error.message}`, "error");
			return;
		}

		trashBooks = trashBooks.filter((candidate) => candidate.id !== book.id);
		toastStore.add(`"${book.title}" restored to library`, "success");
	}

	async function handlePermanentDelete(book: LibraryBook): Promise<void> {
		if (restoringBookId !== null || deletingBookId !== null || emptyingAll) {
			return;
		}

		deletingBookId = book.id;
		const result = await ZUI.deleteTrashedLibraryBook(book.id);
		deletingBookId = null;
		confirmingDeleteBookId = null;

		if (!result.ok) {
			toastStore.add(`Failed to delete "${book.title}": ${result.error.message}`, "error");
			return;
		}

		trashBooks = trashBooks.filter((candidate) => candidate.id !== book.id);
		toastStore.add(`"${book.title}" permanently deleted`, "success");
	}

	async function handleEmptyTrash(): Promise<void> {
		if (trashBooks.length === 0 || emptyingAll || restoringBookId !== null || deletingBookId !== null) {
			return;
		}

		emptyingAll = true;
		const targetBooks = [...trashBooks];

		for (const book of targetBooks) {
			const result = await ZUI.deleteTrashedLibraryBook(book.id);
			if (!result.ok) {
				emptyingAll = false;
				toastStore.add(`Stopped while deleting "${book.title}": ${result.error.message}`, "error");
				await loadTrash();
				return;
			}
		}

		emptyingAll = false;
		isConfirmingEmptyAll = false;
		confirmingDeleteBookId = null;
		trashBooks = [];
		toastStore.add("Trash emptied", "success");
	}
</script>

<div class="trash-page">
	<Loading bind:show={isLoading} />

	{#if error}
		<div class="error-banner">
			<p>{error.message}</p>
			<button onclick={loadTrash}>Retry</button>
		</div>
	{/if}

	<header class="page-header">
		<div>
			<h2>Trash</h2>
			<p>
				{trashBooks.length} item{trashBooks.length === 1 ? "" : "s"} in trash. Items are permanently
				deleted after 30 days.
			</p>
		</div>
		{#if trashBooks.length > 0}
			<button class="empty-trash-btn" onclick={() => (isConfirmingEmptyAll = true)} disabled={emptyingAll || restoringBookId !== null || deletingBookId !== null}>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3 6 5 6 21 6"></polyline>
					<path d="M19 6l-1 14H6L5 6"></path>
					<path d="M10 11v6"></path>
					<path d="M14 11v6"></path>
					<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
				</svg>
				<span>{emptyingAll ? "Emptying..." : "Empty Trash"}</span>
			</button>
		{/if}
	</header>

	{#if isConfirmingEmptyAll}
		<div class="empty-warning">
			<div class="warning-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
					<line x1="12" y1="9" x2="12" y2="13"></line>
					<line x1="12" y1="17" x2="12.01" y2="17"></line>
				</svg>
			</div>
			<div class="warning-main">
				<p class="warning-title">Permanently delete all {trashBooks.length} items?</p>
				<p class="warning-subtitle">This action cannot be undone.</p>
				<div class="warning-actions">
					<button class="warning-delete" onclick={handleEmptyTrash} disabled={emptyingAll}>
						{emptyingAll ? "Deleting..." : "Delete All"}
					</button>
					<button class="warning-cancel" onclick={() => (isConfirmingEmptyAll = false)} disabled={emptyingAll}>Cancel</button>
				</div>
			</div>
		</div>
	{/if}

	{#if !isLoading && trashBooks.length === 0}
		<div class="empty-state">
			<div class="empty-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3 6 5 6 21 6"></polyline>
					<path d="M19 6l-1 14H6L5 6"></path>
					<path d="M10 11v6"></path>
					<path d="M14 11v6"></path>
					<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
				</svg>
			</div>
			<h3>Trash is empty</h3>
			<p>Items you delete will appear here before being permanently removed.</p>
		</div>
	{:else}
		<div class="trash-list">
			{#each trashBooks as book (book.id)}
				<article class="trash-card">
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
						<div class="book-meta-row">
							<span class={`format-badge ${getFormat(book).toLowerCase()}`}>{getFormat(book)}</span>
							<span class="book-size">{formatFileSize(book.filesize)}</span>
						</div>
						<div class="trash-meta-row">
							<span>Trashed {formatDate(book.deleted_at)}</span>
							{#if getDaysUntilDeletion(book.trash_expires_at) !== null}
								{@const daysLeft = getDaysUntilDeletion(book.trash_expires_at)!}
								<span class:urgent={daysLeft <= 7}>
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<circle cx="12" cy="12" r="10"></circle>
										<polyline points="12 6 12 12 16 14"></polyline>
									</svg>
									{daysLeft > 0
										? `Deletes in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
										: "Scheduled for deletion"}
									<em>({formatDate(book.trash_expires_at)})</em>
								</span>
							{/if}
						</div>
					</div>

					<div class="card-actions">
						<button
							type="button"
							class="restore-btn"
							onclick={() => handleRestore(book)}
							disabled={restoringBookId !== null || deletingBookId !== null || emptyingAll}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="1 4 1 10 7 10"></polyline>
								<path d="M3.51 15a9 9 0 1 0 .49-9.36L1 10"></path>
							</svg>
							<span>{restoringBookId === book.id ? "Restoring..." : "Restore"}</span>
						</button>

						{#if confirmingDeleteBookId === book.id}
							<div class="confirm-delete">
								<button
									type="button"
									class="confirm-btn"
									onclick={() => handlePermanentDelete(book)}
									disabled={deletingBookId !== null || emptyingAll}
								>
									{deletingBookId === book.id ? "Deleting..." : "Confirm"}
								</button>
								<button
									type="button"
									class="cancel-btn"
									onclick={() => (confirmingDeleteBookId = null)}
									disabled={deletingBookId !== null || emptyingAll}
								>
									Cancel
								</button>
							</div>
						{:else}
							<button
								type="button"
								class="delete-icon-btn"
								onclick={() => (confirmingDeleteBookId = book.id)}
								disabled={restoringBookId !== null || deletingBookId !== null || emptyingAll}
								title="Delete permanently"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 6 5 6 21 6"></polyline>
									<path d="M19 6l-1 14H6L5 6"></path>
									<path d="M10 11v6"></path>
									<path d="M14 11v6"></path>
									<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
								</svg>
							</button>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.trash-page {
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

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
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

	.empty-trash-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 0.82rem;
		border: 0;
		border-radius: 0.5rem;
		background: color-mix(in oklab, var(--color-danger), transparent 90%);
		color: var(--color-danger);
		font-size: 0.8rem;
		font-family: inherit;
		font-weight: 500;
		cursor: pointer;
	}

	.empty-trash-btn:hover:not(:disabled) {
		background: color-mix(in oklab, var(--color-danger), transparent 84%);
	}

	.empty-trash-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}

	.empty-warning {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.8rem;
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid color-mix(in oklab, var(--color-danger), transparent 80%);
		background: color-mix(in oklab, var(--color-danger), transparent 95%);
	}

	.warning-icon {
		color: var(--color-danger);
		margin-top: 0.06rem;
	}

	.warning-title {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.warning-subtitle {
		margin: 0.2rem 0 0;
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	.warning-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.warning-delete,
	.warning-cancel {
		padding: 0.42rem 0.72rem;
		border-radius: 0.5rem;
		border: 0;
		font-size: 0.78rem;
		font-family: inherit;
		cursor: pointer;
	}

	.warning-delete {
		background: var(--color-danger);
		color: #ffffff;
	}

	.warning-cancel {
		background: #1e2230;
		color: var(--color-text-secondary);
	}

	.trash-list {
		display: grid;
		gap: 0.5rem;
	}

	.trash-card {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border);
		background: #161921;
	}

	.book-cover-wrap {
		width: 3rem;
		height: 4rem;
		border-radius: 0.5rem;
		overflow: hidden;
		flex-shrink: 0;
		opacity: 0.6;
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

	.book-meta-row {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin-top: 0.5rem;
	}

	.format-badge {
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

	.book-size {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.trash-meta-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.82rem;
		margin-top: 0.56rem;
		font-size: 0.74rem;
		color: var(--color-text-muted);
	}

	.trash-meta-row span:last-child {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
	}

	.trash-meta-row span:last-child em {
		font-style: normal;
		opacity: 0.66;
	}

	.trash-meta-row span.urgent {
		color: #f87171;
	}

	.card-actions {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.restore-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.52rem 0.72rem;
		border-radius: 0.5rem;
		border: 0;
		background: #1e2230;
		color: var(--color-text-secondary);
		font-size: 0.8rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
	}

	.restore-btn:hover:not(:disabled) {
		background: #242a39;
		color: var(--color-text-primary);
	}

	.delete-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		border: 0;
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.delete-icon-btn:hover:not(:disabled) {
		color: var(--color-danger);
		background: color-mix(in oklab, var(--color-danger), transparent 92%);
	}

	.confirm-delete {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.confirm-btn,
	.cancel-btn {
		padding: 0.42rem 0.7rem;
		border-radius: 0.5rem;
		border: 0;
		font-size: 0.75rem;
		font-family: inherit;
		cursor: pointer;
	}

	.confirm-btn {
		background: var(--color-danger);
		color: #ffffff;
	}

	.cancel-btn {
		background: #1e2230;
		color: var(--color-text-secondary);
	}

	.restore-btn:disabled,
	.delete-icon-btn:disabled,
	.confirm-btn:disabled,
	.cancel-btn:disabled {
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
		max-width: 34rem;
		font-size: 0.84rem;
		color: var(--color-text-muted);
	}

	@media (max-width: 940px) {
		.trash-card {
			grid-template-columns: auto 1fr;
		}

		.card-actions {
			grid-column: 1 / -1;
			justify-content: flex-start;
		}
	}

	@media (max-width: 640px) {
		.trash-page {
			padding-top: 1rem;
			gap: 1rem;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.page-header h2 {
			font-size: 1.5rem;
		}

		.trash-meta-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.4rem;
		}
	}
</style>
