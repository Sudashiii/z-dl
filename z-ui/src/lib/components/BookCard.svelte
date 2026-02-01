<script lang="ts">
	import DownloadIcon from "$lib/assets/icons/DownloadIcon.svelte";
	import ShareIcon from "$lib/assets/icons/ShareIcon.svelte";
	import type { ZBook } from "$lib/types/ZLibrary/ZBook";

	interface Props {
		book: ZBook;
		onDownload: (book: ZBook) => void;
		onShare: (book: ZBook) => void;
	}

	const { book, onDownload, onShare }: Props = $props();
</script>

<article class="book-card">
	<div class="book-cover">
		{#if book.cover}
			<img src={book.cover} alt={book.title} loading="lazy" />
		{:else}
			<div class="no-cover">
				<span class="extension">{book.extension?.toUpperCase() || "?"}</span>
			</div>
		{/if}
	</div>
	<div class="book-content">
		<div class="book-header">
			<h3 class="book-title" title={book.title}>{book.title}</h3>
			<p class="book-author">by {book.author}</p>
		</div>
		<div class="book-meta">
			<span class="meta-tag format">{book.extension?.toUpperCase()}</span>
			<span class="meta-tag">{book.language}</span>
			{#if book.year}
				<span class="meta-tag">{book.year}</span>
			{/if}
			<span class="meta-tag">{book.filesizeString}</span>
		</div>
		{#if book.publisher}
			<p class="book-publisher">Published by {book.publisher}</p>
		{/if}
		<div class="book-scores">
			{#if book.interestScore}
				<span class="score">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
						<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
					</svg>
					{book.interestScore}
				</span>
			{/if}
			{#if book.qualityScore}
				<span class="score quality">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
						<path d="m9 12 2 2 4-4"></path>
					</svg>
					{book.qualityScore}
				</span>
			{/if}
		</div>
	</div>
	<div class="book-actions">
		<button class="action-btn primary" onclick={() => onDownload(book)} title="Download to device">
			<DownloadIcon />
			<span class="action-label">Download</span>
		</button>
		<button class="action-btn secondary" onclick={() => onShare(book)} title="Add to library">
			<ShareIcon />
			<span class="action-label">Library</span>
		</button>
	</div>
</article>

<style>
	.book-card {
		display: flex;
		align-items: stretch;
		background: rgba(28, 38, 50, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1.25rem;
		gap: 1.25rem;
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
		width: 100px;
		height: 150px;
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
		font-size: 1rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.4);
	}

	.book-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 0.5rem;
	}

	.book-header {
		min-width: 0;
	}

	.book-title {
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.4;
	}

	.book-author {
		margin: 0;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.book-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.meta-tag {
		display: inline-block;
		padding: 0.25rem 0.6rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.meta-tag.format {
		background: rgba(30, 144, 255, 0.15);
		color: #1e90ff;
	}

	.book-publisher {
		margin: 0;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: auto;
	}

	.book-scores {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.score {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #fbbf24;
	}

	.score.quality {
		color: #4ade80;
	}

	.book-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		justify-content: center;
		flex-shrink: 0;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.6rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 110px;
	}

	.action-btn.primary {
		background: linear-gradient(135deg, #1e90ff, #0066cc);
		border: none;
		color: #fff;
	}

	.action-btn.primary:hover {
		background: linear-gradient(135deg, #3ba0ff, #0077ee);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px -4px rgba(30, 144, 255, 0.4);
	}

	.action-btn.secondary {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.8);
	}

	.action-btn.secondary:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.25);
		color: #fff;
	}

	@media (max-width: 700px) {
		.book-card {
			flex-direction: column;
			align-items: center;
			text-align: center;
			padding: 1.5rem;
		}

		.book-cover {
			width: 120px;
			height: 180px;
		}

		.book-content {
			align-items: center;
		}

		.book-header {
			text-align: center;
		}

		.book-title {
			white-space: normal;
			text-overflow: unset;
			word-break: break-word;
		}

		.book-meta {
			justify-content: center;
		}

		.book-scores {
			justify-content: center;
		}

		.book-actions {
			flex-direction: row;
			margin-top: 1rem;
			width: 100%;
		}

		.action-btn {
			flex: 1;
		}

		.action-label {
			display: none;
		}
	}
</style>
