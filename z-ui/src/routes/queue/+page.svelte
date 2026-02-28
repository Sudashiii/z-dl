<script lang="ts">
	import { onMount } from "svelte";
	import { ZUI } from "$lib/client/zui";
	import Loading from "$lib/components/Loading.svelte";
	import type { ApiError } from "$lib/types/ApiError";

	type QueueJob = {
		id: string;
		bookId: string;
		title: string;
		status: "queued" | "processing" | "completed" | "failed";
		attempts: number;
		error?: string;
		createdAt: string;
		updatedAt: string;
		finishedAt?: string;
	};

	let isLoading = $state(true);
	let error = $state<ApiError | null>(null);
	let queueJobs = $state<QueueJob[]>([]);
	let queuePendingCount = $state(0);
	let queueProcessingCount = $state(0);
	let queuePollTimer: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		void refreshQueueStatus(true);
		queuePollTimer = setInterval(() => {
			void refreshQueueStatus(false);
		}, 5000);

		return () => {
			if (queuePollTimer) {
				clearInterval(queuePollTimer);
			}
		};
	});

	async function refreshQueueStatus(showLoader: boolean): Promise<void> {
		if (showLoader) {
			isLoading = true;
		}
		const result = await ZUI.getQueueStatus();
		if (!result.ok) {
			error = result.error;
			if (showLoader) {
				isLoading = false;
			}
			return;
		}

		error = null;
		queuePendingCount = result.value.queueStatus.pending;
		queueProcessingCount = result.value.queueStatus.processing;
		queueJobs = result.value.jobs;
		if (showLoader) {
			isLoading = false;
		}
	}

	function formatQueueDate(value: string): string {
		return new Date(value).toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit"
		});
	}
</script>

<div class="queue-page">
	<Loading bind:show={isLoading} />

	<header class="page-header">
		<h1>Download Queue</h1>
		<p>Monitor queued downloads and their states</p>
	</header>

	<div class="summary-row">
		<span class="summary-badge">Pending: {queuePendingCount}</span>
		<span class="summary-badge">Processing: {queueProcessingCount}</span>
		<button class="refresh-btn" onclick={() => refreshQueueStatus(false)}>Refresh</button>
	</div>

	{#if error}
		<div class="error">
			<p>{error.message}</p>
		</div>
	{/if}

	{#if queueJobs.length === 0 && !isLoading}
		<div class="empty-state">
			<h3>No jobs yet</h3>
			<p>Queue a download from Z-Library to see it here.</p>
		</div>
	{:else}
		<ul class="queue-list">
			{#each queueJobs as job (job.id)}
				<li class="queue-item">
					<div class="queue-item-main">
						<strong>{job.title}</strong>
						<span class="queue-item-sub">Book #{job.bookId}</span>
					</div>
					<div class="queue-item-state">
						<span class={`queue-state ${job.status}`}>{job.status}</span>
						<span class="queue-attempts">Attempt {job.attempts}</span>
					</div>
					<div class="queue-times">
						<span>Created: {formatQueueDate(job.createdAt)}</span>
						<span>Updated: {formatQueueDate(job.updatedAt)}</span>
					</div>
					{#if job.error}
						<p class="queue-item-error">{job.error}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.queue-page {
		padding: 2rem 0;
		color: var(--color-text-primary);
	}

	.page-header {
		margin-bottom: 1.2rem;
	}

	.page-header h1 {
		margin: 0 0 0.4rem;
		font-size: 1.9rem;
	}

	.page-header p {
		margin: 0;
		color: var(--color-text-muted);
	}

	.summary-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.summary-badge {
		padding: 0.3rem 0.65rem;
		border-radius: 999px;
		font-size: 0.78rem;
		background: rgba(61, 162, 255, 0.16);
		border: 1px solid rgba(125, 195, 255, 0.32);
		color: #9bd4ff;
	}

	.refresh-btn {
		background: rgba(12, 28, 44, 0.76);
		border: 1px solid rgba(167, 203, 237, 0.26);
		color: rgba(228, 240, 255, 0.85);
		border-radius: 0.5rem;
		padding: 0.38rem 0.68rem;
		cursor: pointer;
	}

	.queue-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}

	.queue-item {
		background: rgba(9, 21, 34, 0.62);
		border: 1px solid rgba(95, 139, 184, 0.2);
		border-radius: 0.55rem;
		padding: 0.7rem 0.8rem;
		display: grid;
		gap: 0.45rem;
	}

	.queue-item-main {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.queue-item-main strong {
		font-size: 0.88rem;
		color: rgba(236, 245, 255, 0.92);
	}

	.queue-item-sub {
		font-size: 0.76rem;
		color: rgba(190, 211, 235, 0.7);
	}

	.queue-item-state {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}

	.queue-state {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.14rem 0.45rem;
		border-radius: 999px;
		border: 1px solid transparent;
	}

	.queue-state.queued {
		color: #9bd4ff;
		background: rgba(61, 162, 255, 0.16);
		border-color: rgba(125, 195, 255, 0.32);
	}

	.queue-state.processing {
		color: #f9d084;
		background: rgba(224, 169, 61, 0.14);
		border-color: rgba(240, 191, 90, 0.32);
	}

	.queue-state.completed {
		color: #91f3b8;
		background: rgba(42, 159, 94, 0.16);
		border-color: rgba(95, 211, 145, 0.3);
	}

	.queue-state.failed {
		color: #ffb5be;
		background: rgba(121, 38, 48, 0.2);
		border-color: rgba(239, 116, 126, 0.32);
	}

	.queue-attempts {
		font-size: 0.72rem;
		color: rgba(190, 211, 235, 0.7);
	}

	.queue-times {
		display: flex;
		gap: 0.8rem;
		flex-wrap: wrap;
		font-size: 0.74rem;
		color: rgba(190, 211, 235, 0.66);
	}

	.queue-item-error {
		margin: 0;
		font-size: 0.76rem;
		color: #ffb5be;
		word-break: break-word;
	}

	.error {
		background: rgba(121, 38, 48, 0.44);
		border: 1px solid rgba(239, 116, 126, 0.38);
		border-radius: 0.75rem;
		padding: 0.9rem 1rem;
		margin-bottom: 1rem;
		color: #ffb5be;
	}

	.error p {
		margin: 0;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
		background: rgba(11, 25, 40, 0.55);
		border: 1px dashed rgba(160, 194, 226, 0.2);
		border-radius: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.4rem;
	}

	.empty-state p {
		margin: 0;
		color: rgba(203, 222, 245, 0.72);
	}
</style>
