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
		color: var(--color-text-primary);
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
		font-size: 1.9rem;
		font-weight: 600;
	}

	.header-content p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.98rem;
	}

	.stat-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(61, 162, 255, 0.16);
		border: 1px solid rgba(117, 191, 255, 0.32);
		border-radius: 2rem;
		color: #9dd6ff;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.book-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.book-card {
		display: flex;
		gap: 1rem;
		background: linear-gradient(160deg, rgba(17, 37, 58, 0.82), rgba(12, 27, 44, 0.78));
		border: 1px solid rgba(160, 194, 226, 0.2);
		border-radius: 1.1rem;
		padding: 1.25rem;
		transition: all 0.2s ease;
		box-shadow: inset 0 1px 0 rgba(210, 230, 252, 0.04);
	}

	.book-card:hover {
		border-color: rgba(160, 209, 252, 0.34);
		background: linear-gradient(160deg, rgba(20, 43, 68, 0.9), rgba(14, 31, 50, 0.87));
		transform: translateY(-2px);
		box-shadow: 0 18px 26px -22px rgba(60, 145, 221, 0.65);
	}

	.book-cover {
		flex-shrink: 0;
		width: 80px;
		height: 120px;
		border-radius: 0.7rem;
		overflow: hidden;
		box-shadow: 0 16px 22px -20px rgba(0, 0, 0, 0.9);
	}

	.book-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-cover {
		width: 100%;
		height: 100%;
		background: linear-gradient(145deg, rgba(37, 67, 98, 0.7) 0%, rgba(16, 29, 43, 0.9) 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.no-cover .extension {
		font-size: 0.9rem;
		font-weight: 700;
		color: rgba(216, 233, 250, 0.55);
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
		color: rgba(214, 232, 252, 0.68);
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
		background: rgba(189, 220, 250, 0.1);
		border: 1px solid rgba(173, 208, 241, 0.2);
		padding: 0.2rem 0.5rem;
		border-radius: 0.45rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: rgba(214, 232, 252, 0.75);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.tag.format {
		background: rgba(61, 162, 255, 0.2);
		border-color: rgba(125, 195, 255, 0.32);
		color: #9bd4ff;
	}

	.details {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		color: rgba(203, 222, 245, 0.56);
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(160, 194, 226, 0.15);
	}

	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 4rem 2rem;
		background: rgba(11, 25, 40, 0.55);
		border: 1px dashed rgba(160, 194, 226, 0.2);
		border-radius: 1rem;
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100px;
		height: 100px;
		background: linear-gradient(145deg, rgba(61, 162, 255, 0.2), rgba(35, 92, 145, 0.18));
		border-radius: 50%;
		color: #97d3ff;
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
		background: linear-gradient(135deg, #2f8be9, #4ea7ff);
		border: 1px solid rgba(124, 193, 255, 0.4);
		color: #f6fbff;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.link-btn:hover {
		background: linear-gradient(135deg, #3c96f2, #66b8ff);
		transform: translateY(-1px);
		box-shadow: 0 12px 20px -14px rgba(73, 170, 255, 0.9);
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
		flex: 1;
	}

	.error button {
		background: rgba(132, 40, 51, 0.46);
		border: none;
		color: #ffb5be;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s ease;
	}

	.error button:hover {
		background: rgba(152, 50, 61, 0.54);
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
		background: rgba(42, 159, 94, 0.2);
		color: #91f3b8;
		border: 1px solid rgba(95, 211, 145, 0.3);
	}

	.right-details {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.reset-btn {
		background: transparent;
		border: none;
		color: rgba(205, 222, 244, 0.54);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.reset-btn:hover {
		background: rgba(132, 40, 51, 0.46);
		color: #ffb5be;
	}

	/* Confirmation Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(1, 6, 14, 0.72);
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
		background: linear-gradient(160deg, rgba(17, 37, 58, 0.95), rgba(11, 25, 40, 0.95));
		border: 1px solid rgba(160, 194, 226, 0.2);
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
		background: rgba(251, 191, 36, 0.2);
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
		color: rgba(214, 232, 252, 0.72);
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.modal-description strong {
		color: rgba(236, 245, 255, 0.95);
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
		background: rgba(12, 28, 44, 0.76);
		color: rgba(228, 240, 255, 0.85);
		border: 1px solid rgba(167, 203, 237, 0.26);
	}

	.modal-btn.cancel:hover {
		background: rgba(19, 40, 63, 0.9);
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
