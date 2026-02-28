<script lang="ts">
	interface Props {
		show?: boolean;
	}

	let { show = $bindable(false) }: Props = $props();
</script>

{#if show}
	<div class="overlay">
		<div class="loader">
			<div class="spinner"></div>
			<span class="loading-text">Loading...</span>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: grid;
		place-items: center;
		z-index: 9999;
	}

	.loader {
		display: grid;
		justify-items: center;
		gap: 0.75rem;
		padding: 0.95rem 1.05rem;
		border-radius: 0.78rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid rgba(201, 169, 98, 0.25);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.9s linear infinite;
	}

	.loading-text {
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
