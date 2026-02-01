<script lang="ts">
    import type { Toast } from "$lib/client/stores/toastStore.svelte";
    import { toastStore } from "$lib/client/stores/toastStore.svelte";
    import { fade, fly } from "svelte/transition";

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
    in:fly={{ y: 20, duration: 300 }}
    out:fade={{ duration: 200 }}
    role="alert"
>
    <div class="icon">
        {#if toast.type === 'success'}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        {:else if toast.type === 'error'}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        {/if}
    </div>
    <span class="message">{toast.message}</span>
    <button class="close-btn" onclick={dismiss} aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    </button>
</div>

<style>
    .toast {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 320px;
        max-width: 420px;
        padding: 1rem 1.25rem;
        border-radius: 0.75rem;
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.3),
            0 8px 10px -6px rgba(0, 0, 0, 0.2);
        color: #fff;
        font-size: 0.9rem;
        pointer-events: auto;
        backdrop-filter: blur(8px);
    }

    .toast.info {
        background: rgba(28, 38, 50, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .toast.info .icon {
        color: #1e90ff;
    }

    .toast.success {
        background: rgba(22, 101, 52, 0.95);
        border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .toast.success .icon {
        color: #4ade80;
    }

    .toast.error {
        background: rgba(127, 29, 29, 0.95);
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .toast.error .icon {
        color: #fca5a5;
    }

    .icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .message {
        flex: 1;
        line-height: 1.4;
    }

    .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        color: currentColor;
        cursor: pointer;
        opacity: 0.6;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: all 0.2s ease;
        flex-shrink: 0;
    }

    .close-btn:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
    }
</style>
