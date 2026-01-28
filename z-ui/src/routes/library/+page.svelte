<script lang="ts">
	import { onMount } from "svelte";
	import type { Book } from "$lib/server/infrastructure/dbModels/models";
	import type { ApiError } from "$lib/types/ApiError";
	import Loading from "$lib/components/Loading.svelte";
	import { ZUI } from "$lib/client/zui";

	import TrashIcon from "$lib/assets/icons/TrashIcon.svelte";
	import { toastStore } from "$lib/client/stores/toastStore.svelte";

	let books = $state<Book[]>([]);
	let isLoading = $state(true);
	let error = $state<ApiError | null>(null);

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

	async function handleResetStatus(book: Book) {
		if (!confirm(`Reset download status for "${book.title}"?`)) return;

		// Optimistic update
		const originalStatus = book.isDownloaded;
		const index = books.findIndex((b) => b.id === book.id);
		if (index !== -1) {
			// Create a new array reference to trigger reactivity if needed
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

<div class="library">
	<Loading bind:show={isLoading} />

	<header class="page-header">
		<h1>My Library</h1>
		<p>Books you've downloaded and saved to your library</p>
		<span class="book-count"
			>{books.length} book{books.length !== 1 ? "s" : ""}</span
		>
	</header>

	{#if error}
		<div class="error">
			<p>{error.message}</p>
			<button onclick={loadLibrary}>Retry</button>
		</div>
	{/if}

	<div class="book-grid">
		{#if books.length > 0}
			{#each books as book (book.id)}
				<div class="book-card">
					<div class="book-cover">
						{#if book.cover}
							<img src={book.cover} alt={book.title} />
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
									<span class="dot"></span> Downloaded
								</span>
							{/if}
							{#if book.extension}
								<span class="tag"
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
							<span>{formatFileSize(book.filesize)}</span>
							<div class="right-details">
								{#if book.isDownloaded}
									<button
										class="reset-btn"
										onclick={() => handleResetStatus(book)}
										title="Reset download status"
									>
										<TrashIcon size="14" />
									</button>
								{/if}
								<span>Added {formatDate(book.createdAt)}</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{:else if !isLoading}
			<div class="empty-state">
				<p>Your library is empty</p>
				<p class="hint">
					Download books from Z-Library search to add them here
				</p>
				<a href="/search" class="link-btn">Go to Search</a>
			</div>
		{/if}
	</div>
</div>

<style>
	.library {
		padding: 2rem 0;
		color: #fff;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
	}

	.page-header p {
		margin: 0 0 0.5rem 0;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.9rem;
	}

	.book-count {
		display: inline-block;
		background: rgba(30, 144, 255, 0.2);
		color: #1e90ff;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.85rem;
	}

	.book-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.book-card {
		display: flex;
		gap: 1rem;
		background: rgb(28, 38, 50);
		border: 1px solid #324d67;
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}

	.book-card:hover {
		border-color: #4a6a8a;
		transform: translateY(-2px);
	}

	.book-cover {
		flex-shrink: 0;
		width: 80px;
		height: 120px;
	}

	.book-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.3rem;
	}

	.no-cover {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #2d3a4a 0%, #1a242f 100%);
		border-radius: 0.3rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.no-cover .extension {
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.5);
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
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
		gap: 0.35rem;
		margin-bottom: auto;
	}

	.tag {
		display: inline-block;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.15rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.details {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.5rem;
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 4rem 2rem;
		background: rgb(28, 38, 50);
		border-radius: 0.75rem;
		border: 1px dashed #324d67;
	}

	.empty-state p {
		margin: 0 0 0.5rem 0;
		color: rgba(255, 255, 255, 0.7);
	}

	.empty-state .hint {
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
	}

	.link-btn {
		display: inline-block;
		background: #1e90ff;
		color: #fff;
		padding: 0.6rem 1.5rem;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 500;
		transition: background 0.2s;
	}

	.link-btn:hover {
		background: #0077ff;
	}

	.error {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.5);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
		color: #fca5a5;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.error p {
		margin: 0;
	}

	.error button {
		background: rgba(239, 68, 68, 0.3);
		border: none;
		color: #fca5a5;
		padding: 0.4rem 1rem;
		border-radius: 0.3rem;
		cursor: pointer;
	}

	.error button:hover {
		background: rgba(239, 68, 68, 0.4);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.15rem 0.6rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.status-badge.downloaded {
		background: rgba(34, 197, 94, 0.15);
		color: #4ade80;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.dot {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: currentColor;
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
		transition: all 0.2s;
	}

	.reset-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		color: #fca5a5;
	}
</style>
