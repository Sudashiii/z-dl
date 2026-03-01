<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		title: string;
		showTabs?: boolean;
		onClose: () => void;
		children: Snippet;
		headerActions?: Snippet;
		tabs?: Snippet;
	}

	let { title, showTabs = false, onClose, children, headerActions, tabs }: Props = $props();

	function handleOverlayKeyDown(event: KeyboardEvent): void {
		if (event.key === "Escape") {
			onClose();
		}
	}
</script>

<div
	class="detail-modal-overlay"
	role="button"
	tabindex="0"
	aria-label="Close book detail modal"
	onclick={onClose}
	onkeydown={handleOverlayKeyDown}
>
	<div
		class="detail-modal-content detail-v2-shell"
		role="dialog"
		aria-modal="true"
		aria-labelledby="book-detail-title"
		tabindex="-1"
		onclick={(event) => event.stopPropagation()}
		onkeydown={(event) => event.stopPropagation()}
	>
		<div class="detail-v2-header">
			<h2 id="book-detail-title">{title}</h2>
			<div class="detail-v2-header-actions">
				{@render headerActions?.()}
				<button class="detail-v2-close-btn" onclick={onClose} aria-label="Close details">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
		</div>

		{#if showTabs}
			<div class="detail-v2-tabs" role="tablist" aria-label="Book detail sections">
				{@render tabs?.()}
			</div>
		{/if}

		<div class="detail-v2-body">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.detail-modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(4px);
		display: grid;
		place-items: center;
		padding: 0.85rem;
		z-index: 1200;
	}

	.detail-modal-content {
		width: min(960px, 100%);
		max-height: calc(100dvh - 1.6rem);
		overflow-y: auto;
		border-radius: 0.9rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		padding: 0.9rem;
		display: grid;
		gap: 0.58rem;
	}

	.detail-v2-shell {
		padding: 0;
		gap: 0;
	}

	.detail-v2-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		background: rgba(18, 20, 27, 0.95);
		backdrop-filter: blur(4px);
		z-index: 5;
	}

	.detail-v2-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.detail-v2-header-actions {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.detail-v2-close-btn {
		width: 2rem;
		height: 2rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.detail-v2-close-btn:hover {
		color: var(--color-text-primary);
	}

	.detail-v2-tabs {
		display: flex;
		gap: 0.45rem;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid var(--color-border);
		overflow-x: auto;
	}

	.detail-v2-tabs :global(button) {
		padding: 0.4rem 0.75rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: #1e2230;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.detail-v2-tabs :global(button.active) {
		background: #c9a962;
		color: #0d1013;
		border-color: transparent;
	}

	.detail-v2-body {
		padding: 1.25rem;
		display: grid;
		gap: 1rem;
	}

	@media (max-width: 900px) {
		.detail-modal-content.detail-v2-shell {
			max-height: calc(100dvh - 1rem);
		}

		.detail-v2-header {
			padding: 0.875rem 1rem;
		}

		.detail-v2-header h2 {
			font-size: 1.125rem;
		}

		.detail-v2-body {
			padding: 1rem;
		}
	}

	@media (max-width: 640px) {
		.detail-v2-header {
			flex-direction: column;
			align-items: stretch;
		}

		.detail-v2-header-actions {
			justify-content: flex-end;
			flex-wrap: wrap;
		}
	}
</style>
