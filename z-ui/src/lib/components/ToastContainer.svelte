<script lang="ts">
    import { toastStore } from "$lib/client/stores/toastStore.svelte";
    import Toast from "./Toast.svelte";
</script>

<div class="toast-container">
    {#each toastStore.toasts as toast (toast.id)}
        <Toast {toast} />
    {/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		z-index: 9999;
		pointer-events: none;
	}

	@media (max-width: 640px) {
		.toast-container {
			left: 0.75rem;
			right: 0.75rem;
			bottom: 0.75rem;
		}
	}
</style>
