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

<div class="book-card">
	<img src={book.cover} alt={book.title} />
	<div class="details">
		<div class="title-group">
			<h3 title={book.title}>{book.title}</h3>
			<p class="author">by {book.author}</p>
		</div>
		<p class="info">
			{book.language} | {book.year} | {book.filesizeString} |
			{book.extension} | Interest Score: {book.interestScore} | Quality Score:
			{book.qualityScore} | published by {book.publisher}
		</p>
	</div>
	<div class="icon-btn-wrapper">
		<button class="icon-btn" onclick={() => onDownload(book)}>
			<DownloadIcon />
		</button>
	</div>
	<div class="icon-btn-wrapper">
		<button class="icon-btn" onclick={() => onShare(book)}>
			<ShareIcon />
		</button>
	</div>
</div>

<style>
	.book-card {
		display: flex;
		justify-content: space-between;
		align-items: stretch;
		background: rgb(28, 38, 50);
		border: 1px solid #324d67;
		border-radius: 0.75rem;
		padding: 1rem;
		gap: 1rem;
		transition: all 0.2s ease;
	}

	.book-card img {
		width: calc(80px * 1.5);
		height: calc(120px * 1.5);
		border-radius: 0.3rem;
		object-fit: cover;
		flex-shrink: 0;
	}

	.details {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-width: 0;
	}

	.title-group {
		min-width: 0;
	}

	.details h3 {
		margin: 0 0 0.3rem 0;
		font-size: 1.3rem;
		flex-shrink: 1;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.details p {
		margin: 0.1rem 0;
		font-size: 0.9rem;
	}

	.icon-btn-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		justify-content: center;
	}

	.icon-btn {
		font-size: 1.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 8px;
		border-radius: 0.75rem;
	}

	.icon-btn:hover {
		background-color: rgb(39, 54, 71);
	}

	.author,
	.info {
		color: rgba(255, 255, 255, 0.635);
	}

	@media (max-width: 700px) {
		.book-card {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.book-card img {
			width: 120px;
			height: 180px;
			margin-bottom: 0.5rem;
		}

		.details {
			align-items: center;
		}

		.details h3 {
			white-space: normal;
			text-overflow: unset;
			word-break: break-word;
			overflow-wrap: anywhere;
		}

		.icon-btn-wrapper {
			flex-direction: row;
			justify-content: center;
			margin-top: 0.5rem;
			gap: 1rem;
		}
	}
</style>
