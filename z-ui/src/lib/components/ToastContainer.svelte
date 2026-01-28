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
        bottom: 2rem;
        right: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        z-index: 9999;
        pointer-events: none; /* Allows clicking through the container area */
    }
</style>
