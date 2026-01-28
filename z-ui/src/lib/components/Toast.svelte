<script lang="ts">
    import type { Toast } from "$lib/client/stores/toastStore.svelte";
    import { toastStore } from "$lib/client/stores/toastStore.svelte";
    import { fade } from "svelte/transition";

    interface Props {
        toast: Toast;
    }

    const { toast }: Props = $props();

    function dismiss() {
        toastStore.remove(toast.id);
    }
</script>

<div
    class="toast {toast.type}"
    transition:fade={{ duration: 200 }}
    role="alert"
>
    <span class="message">{toast.message}</span>
    <button class="close-btn" onclick={dismiss} aria-label="Close">×</button>
</div>

<style>
    .toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        color: #fff;
        font-size: 0.9rem;
        pointer-events: auto;
    }

    .toast.info {
        background-color: rgb(39, 54, 71);
        border: 1px solid #324d67;
    }

    .toast.success {
        background-color: rgba(34, 197, 94, 0.9);
        border: 1px solid #22c55e;
    }

    .toast.error {
        background-color: rgba(239, 68, 68, 0.9);
        border: 1px solid #ef4444;
    }

    .message {
        flex: 1;
        margin-right: 0.5rem;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: currentColor;
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
        opacity: 0.7;
        padding: 0;
    }

    .close-btn:hover {
        opacity: 1;
    }
</style>
