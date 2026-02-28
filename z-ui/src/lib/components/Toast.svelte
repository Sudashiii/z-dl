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
		gap: 0.6rem;
		min-width: 260px;
		max-width: 380px;
		padding: 0.7rem 0.78rem;
		border-radius: 0.62rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.79rem;
		pointer-events: auto;
	}

	.toast.info {
		border-color: rgba(96, 165, 250, 0.4);
	}

	.toast.info .icon {
		color: #60a5fa;
	}

	.toast.success {
		border-color: rgba(74, 222, 128, 0.4);
	}

	.toast.success .icon {
		color: #4ade80;
	}

	.toast.error {
		border-color: rgba(196, 68, 58, 0.5);
		color: #ffb4ad;
	}

	.toast.error .icon {
		color: #ff8d84;
	}

	.icon {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.message {
		flex: 1;
		line-height: 1.35;
	}

	.close-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.55rem;
		height: 1.55rem;
		border-radius: 0.42rem;
		border: 0;
		background: transparent;
		color: currentColor;
		opacity: 0.62;
		cursor: pointer;
	}

	.close-btn:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.06);
	}
</style>
