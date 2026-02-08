<script lang="ts">
	import { onMount } from "svelte";
	import type { LibraryBook } from "$lib/types/Library/Book";
	import type { ApiError } from "$lib/types/ApiError";
	import Loading from "$lib/components/Loading.svelte";
	import { ZUI } from "$lib/client/zui";

	import { toastStore } from "$lib/client/stores/toastStore.svelte";

	let books = $state<LibraryBook[]>([]);
	let isLoading = $state(true);
	let error = $state<ApiError | null>(null);

	let showConfirmModal = $state(false);
	let bookToReset = $state<LibraryBook | null>(null);

	onMount(async () => {
		await loadLibrary();
	});

	async function loadLibrary() {
		isLoading = true;
		error = null;

		const result = await ZUI.getLibrary();

		if (result.ok) {
			books = result.value.books;
		} else {
			error = result.error;
		}

		isLoading = false;
	}

	function openResetModal(book: LibraryBook) {
		bookToReset = book;
		showConfirmModal = true;
	}

	function closeResetModal() {
		showConfirmModal = false;
		bookToReset = null;
	}

	async function confirmResetStatus() {
		if (!bookToReset) return;
		
		const book = bookToReset;
		closeResetModal();

		const originalStatus = book.isDownloaded;
		const index = books.findIndex((b) => b.id === book.id);
		if (index !== -1) {
			const updatedBooks = [...books];
			updatedBooks[index] = {
				...updatedBooks[index],
				isDownloaded: false,
			};
			books = updatedBooks;
		}

		const result = await ZUI.resetDownloadStatus(book.id);

		if (!result.ok) {
			// Revert if failed
			const revertIndex = books.findIndex((b) => b.id === book.id);
			if (revertIndex !== -1) {
				const updatedBooks = [...books];
				updatedBooks[revertIndex] = {
					...updatedBooks[revertIndex],
					isDownloaded: originalStatus,
				};
				books = updatedBooks;
			}
			toastStore.add(
				`Failed to reset status: ${result.error.message}`,
				"error",
			);
		} else {
			toastStore.add(
				`Reset download status for "${book.title}"`,
				"success",
			);
		}
	}

	function formatFileSize(bytes: number | null): string {
		if (!bytes) return "Unknown";
		const units = ["B", "KB", "MB", "GB"];
		let size = bytes;
		let unitIndex = 0;
		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}
		return `${size.toFixed(1)} ${units[unitIndex]}`;
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return "Unknown";
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}
</script>

<div class="library-page">
	<Loading bind:show={isLoading} />

	<header class="page-header">
		<div class="header-content">
			<h1>My Library</h1>
			<p>Your saved and downloaded books</p>
		</div>
		<div class="header-stats">
			<div class="stat-badge">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
					<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
				</svg>
				<span>{books.length} book{books.length !== 1 ? "s" : ""}</span>
			</div>
		</div>
	</header>

	{#if error}
		<div class="error">
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="12" y1="8" x2="12" y2="12"></line>
				<line x1="12" y1="16" x2="12.01" y2="16"></line>
			</svg>
			<p>{error.message}</p>
			<button onclick={loadLibrary}>Retry</button>
		</div>
	{/if}

	<div class="book-grid">
		{#if books.length > 0}
			{#each books as book (book.id)}
				<article class="book-card">
					<div class="book-cover">
						{#if book.cover}
							<img src={book.cover} alt={book.title} loading="lazy" />
						{:else}
							<div class="no-cover">
								<span class="extension"
									>{book.extension?.toUpperCase() ||
										"?"}</span
								>
							</div>
						{/if}
					</div>
					<div class="book-info">
						<h3 title={book.title}>{book.title}</h3>
						{#if book.author}
							<p class="author">by {book.author}</p>
						{/if}
						<div class="meta">
							{#if book.isDownloaded}
								<span
									class="status-badge downloaded"
									title="Downloaded to device"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="20 6 9 17 4 12"></polyline>
									</svg>
									Downloaded
								</span>
							{/if}
							{#if book.extension}
								<span class="tag format"
									>{book.extension.toUpperCase()}</span
								>
							{/if}
							{#if book.language}
								<span class="tag">{book.language}</span>
							{/if}
							{#if book.year}
								<span class="tag">{book.year}</span>
							{/if}
						</div>
						<div class="details">
							<span class="filesize">{formatFileSize(book.filesize)}</span>
							<div class="right-details">
								{#if book.isDownloaded}
									<button
										class="reset-btn"
										onclick={() => openResetModal(book)}
										title="Reset download status"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
											<path d="M3 3v5h5"></path>
										</svg>
									</button>
								{/if}
								<span class="date">Added {formatDate(book.createdAt)}</span>
							</div>
						</div>
					</div>
				</article>
			{/each}
		{:else if !isLoading}
			<div class="empty-state">
				<div class="empty-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
						<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
					</svg>
				</div>
				<h3>Your library is empty</h3>
				<p>Search and download books from Z-Library to build your collection</p>
				<a href="/search" class="link-btn">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
					Go to Search
				</a>
			</div>
		{/if}
	</div>
</div>

<!-- Confirmation Modal -->
{#if showConfirmModal && bookToReset}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="modal-overlay" 
		onclick={closeResetModal}
		onkeydown={(e) => e.key === 'Escape' && closeResetModal()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
			<div class="modal-icon">
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
					<path d="M3 3v5h5"></path>
				</svg>
			</div>
			<h3 id="modal-title">Reset Download Status</h3>
			<p class="modal-description">
				This will mark <strong>"{bookToReset.title}"</strong> as not downloaded. 
				The book will remain in your library—only the download status will be reset.
			</p>
			<div class="modal-actions">
				<button class="modal-btn cancel" onclick={closeResetModal}>Cancel</button>
				<button class="modal-btn confirm" onclick={confirmResetStatus}>Reset Status</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.library-page {
		padding: 2rem 0;
		color: #fff;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-content h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		font-weight: 600;
	}

	.header-content p {
		margin: 0;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.95rem;
	}

	.stat-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(30, 144, 255, 0.15);
		border: 1px solid rgba(30, 144, 255, 0.25);
		border-radius: 2rem;
		color: #1e90ff;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.book-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.book-card {
		display: flex;
		gap: 1rem;
		background: rgba(28, 38, 50, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1.25rem;
		transition: all 0.2s ease;
	}

	.book-card:hover {
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(28, 38, 50, 0.8);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.3);
	}

	.book-cover {
		flex-shrink: 0;
		width: 80px;
		height: 120px;
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.4);
	}

	.book-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-cover {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #2d3a4a 0%, #1a242f 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.no-cover .extension {
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.4);
	}

	.book-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.book-info h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.4;
	}

	.author {
		margin: 0 0 0.5rem 0;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.6);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: auto;
	}

	.tag {
		display: inline-block;
		background: rgba(255, 255, 255, 0.08);
		padding: 0.2rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.7rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.tag.format {
		background: rgba(30, 144, 255, 0.15);
		color: #1e90ff;
	}

	.details {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 4rem 2rem;
		background: rgba(28, 38, 50, 0.4);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100px;
		height: 100px;
		background: linear-gradient(135deg, rgba(30, 144, 255, 0.1), rgba(99, 102, 241, 0.1));
		border-radius: 50%;
		color: #1e90ff;
		margin-bottom: 1.5rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.empty-state p {
		margin: 0 0 1.5rem 0;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.95rem;
		max-width: 300px;
	}

	.link-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #1e90ff, #0066cc);
		color: #fff;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.link-btn:hover {
		background: linear-gradient(135deg, #3ba0ff, #0077ee);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px -4px rgba(30, 144, 255, 0.4);
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
		flex: 1;
	}

	.error button {
		background: rgba(239, 68, 68, 0.2);
		border: none;
		color: #fca5a5;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s ease;
	}

	.error button:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.6rem;
		border-radius: 1rem;
		font-size: 0.7rem;
		font-weight: 500;
	}

	.status-badge.downloaded {
		background: rgba(34, 197, 94, 0.15);
		color: #4ade80;
		border: 1px solid rgba(34, 197, 94, 0.25);
	}

	.right-details {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.reset-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.4);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.reset-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		color: #fca5a5;
	}

	/* Confirmation Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-content {
		background: linear-gradient(145deg, rgba(28, 38, 50, 0.98), rgba(20, 28, 38, 0.98));
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 2rem;
		max-width: 420px;
		width: 90%;
		text-align: center;
		box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.25s ease;
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

	.modal-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		background: rgba(251, 191, 36, 0.15);
		border-radius: 50%;
		color: #fbbf24;
		margin-bottom: 1.25rem;
	}

	.modal-content h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #fff;
	}

	.modal-description {
		margin: 0 0 1.5rem 0;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.modal-description strong {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	.modal-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.modal-btn.cancel {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.modal-btn.cancel:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
	}

	.modal-btn.confirm {
		background: linear-gradient(135deg, #fbbf24, #f59e0b);
		color: #1a1a2e;
	}

	.modal-btn.confirm:hover {
		background: linear-gradient(135deg, #fcd34d, #fbbf24);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px -4px rgba(251, 191, 36, 0.4);
	}

	@media (max-width: 900px) {
		.library-page {
			padding: 1.25rem 0 1.5rem;
		}

		.book-grid {
			grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		}
	}

	@media (max-width: 640px) {
		.page-header {
			margin-bottom: 1.25rem;
			gap: 0.8rem;
		}

		.header-content h1 {
			font-size: 1.45rem;
		}

		.book-grid {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.9rem;
		}

		.book-card {
			padding: 0.9rem;
			gap: 0.8rem;
		}

		.book-cover {
			width: 64px;
			height: 96px;
		}

		.book-info h3,
		.author {
			white-space: normal;
			overflow: visible;
		}

		.details {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.55rem;
		}

		.right-details {
			width: 100%;
			justify-content: space-between;
		}

		.error {
			flex-wrap: wrap;
		}

		.error button {
			width: 100%;
		}

		.modal-content {
			width: min(94vw, 420px);
			padding: 1.25rem;
		}

		.modal-actions {
			flex-direction: column;
		}

		.modal-btn {
			width: 100%;
		}
	}
</style>
