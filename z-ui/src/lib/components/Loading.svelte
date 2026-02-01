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
		background: rgba(15, 20, 25, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		backdrop-filter: blur(8px);
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.loader {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 3px solid rgba(30, 144, 255, 0.2);
		border-top-color: #1e90ff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.loading-text {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		font-weight: 500;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
