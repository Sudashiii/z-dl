<script lang="ts">
	import { onMount } from "svelte";
	import { ZUI } from "$lib/client/zui";
	import Loading from "$lib/components/Loading.svelte";
	import type { ApiError } from "$lib/types/ApiError";

	type QueueTab = "all" | "queued" | "processing" | "completed" | "failed";
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
		author?: string;
		progress?: number;
		maxRetries?: number;
	};

	const QUEUE_TABS: Array<{ key: QueueTab; label: string }> = [
		{ key: "all", label: "All" },
		{ key: "queued", label: "Queued" },
		{ key: "processing", label: "Processing" },
		{ key: "completed", label: "Completed" },
		{ key: "failed", label: "Failed" }
	];

	let isLoading = $state(true);
	let error = $state<ApiError | null>(null);
	let queueJobs = $state<QueueJob[]>([]);
	let activeTab = $state<QueueTab>("all");
	let queuePollTimer: ReturnType<typeof setInterval> | null = null;
	let isRefreshing = $state(false);
	let refreshQueued = $state(false);

	let queueCounts = $derived({
		all: queueJobs.length,
		queued: queueJobs.filter((job) => job.status === "queued").length,
		processing: queueJobs.filter((job) => job.status === "processing").length,
		completed: queueJobs.filter((job) => job.status === "completed").length,
		failed: queueJobs.filter((job) => job.status === "failed").length
	});

	let visibleJobs = $derived(
		activeTab === "all" ? queueJobs : queueJobs.filter((job) => job.status === activeTab)
	);

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
		if (isRefreshing) {
			refreshQueued = true;
			return;
		}

		isRefreshing = true;
		if (showLoader) {
			isLoading = true;
		}

		try {
			const result = await ZUI.getQueueStatus();
			if (!result.ok) {
				error = result.error;
				return;
			}

			error = null;
			queueJobs = result.value.jobs as QueueJob[];
		} finally {
			if (showLoader) {
				isLoading = false;
			}
			isRefreshing = false;
			if (refreshQueued) {
				refreshQueued = false;
				void refreshQueueStatus(false);
			}
		}
	}

	function formatQueueDateTime(value: string): string {
		return new Date(value).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit"
		});
	}

	function statusLabel(status: QueueJob["status"]): string {
		if (status === "queued") return "Queued";
		if (status === "processing") return "Processing";
		if (status === "completed") return "Completed";
		return "Failed";
	}

	function getJobAuthor(job: QueueJob): string {
		return job.author?.trim() ? job.author : `Book #${job.bookId}`;
	}

	function getProgress(job: QueueJob): number | null {
		if (typeof job.progress !== "number") {
			return null;
		}
		return Math.max(0, Math.min(100, job.progress));
	}

	function getRetryLimit(job: QueueJob): number {
		if (typeof job.maxRetries === "number" && job.maxRetries > 0) {
			return job.maxRetries;
		}
		return 3;
	}
</script>

<div class="queue-page">
	<Loading bind:show={isLoading} />

	{#if error}
		<div class="error-banner">
			<p>{error.message}</p>
		</div>
	{/if}

	<section class="stats-grid" aria-label="Queue stats">
		<article class="stat-card">
			<p>In Queue</p>
			<h2 class="queued">{queueCounts.queued}</h2>
		</article>
		<article class="stat-card">
			<p>Processing</p>
			<h2 class="processing">{queueCounts.processing}</h2>
		</article>
		<article class="stat-card">
			<p>Completed</p>
			<h2 class="completed">{queueCounts.completed}</h2>
		</article>
		<article class="stat-card">
			<p>Failed</p>
			<h2 class="failed">{queueCounts.failed}</h2>
		</article>
	</section>

	<div class="tabs-row" role="tablist" aria-label="Queue filters">
		{#each QUEUE_TABS as tab}
			<button
				type="button"
				role="tab"
				class="tab-btn"
				class:active={activeTab === tab.key}
				aria-selected={activeTab === tab.key}
				onclick={() => (activeTab = tab.key)}
			>
				<span class="tab-icon" aria-hidden="true">
						{#if tab.key === "all"}
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
							<line x1="8" y1="6" x2="21" y2="6"></line>
							<line x1="8" y1="12" x2="21" y2="12"></line>
							<line x1="8" y1="18" x2="21" y2="18"></line>
							<line x1="3" y1="6" x2="3.01" y2="6"></line>
							<line x1="3" y1="12" x2="3.01" y2="12"></line>
							<line x1="3" y1="18" x2="3.01" y2="18"></line>
						</svg>
						{:else if tab.key === "queued"}
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<polyline points="12 6 12 12 16 14"></polyline>
						</svg>
						{:else if tab.key === "processing"}
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" class="spin-icon">
							<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
						</svg>
						{:else if tab.key === "completed"}
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<polyline points="9 12 12 15 17 10"></polyline>
						</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="8" x2="12" y2="12"></line>
							<line x1="12" y1="16" x2="12.01" y2="16"></line>
						</svg>
					{/if}
				</span>
				<span>{tab.label}</span>
				<span class="tab-count">{queueCounts[tab.key]}</span>
			</button>
		{/each}
	</div>

	{#if visibleJobs.length === 0 && !isLoading}
		<div class="empty-state">
			<h3>Queue is empty</h3>
			<p>Search for books and add them to your download queue.</p>
		</div>
	{:else}
		<div class="queue-list">
			{#each visibleJobs as job (job.id)}
				<article class="queue-card" class:failed={job.status === "failed"}>
					<div class="queue-head">
						<div class="queue-head-left">
							<span class={`job-icon ${job.status}`} aria-hidden="true">
								{#if job.status === "queued"}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
										<circle cx="12" cy="12" r="10"></circle>
										<polyline points="12 6 12 12 16 14"></polyline>
									</svg>
								{:else if job.status === "processing"}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" class="spin-icon">
										<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
									</svg>
								{:else if job.status === "completed"}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
										<circle cx="12" cy="12" r="10"></circle>
										<polyline points="9 12 12 15 17 10"></polyline>
									</svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
										<circle cx="12" cy="12" r="10"></circle>
										<line x1="12" y1="8" x2="12" y2="12"></line>
										<line x1="12" y1="16" x2="12.01" y2="16"></line>
									</svg>
								{/if}
							</span>
							<div class="queue-title-block">
								<div class="queue-title-row">
									<p class="queue-title" title={job.title}>{job.title}</p>
									<span class={`queue-status-pill ${job.status}`}>
										{#if job.status === "processing"}
											<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" class="spin-icon status-pill-icon">
												<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
											</svg>
										{/if}
										{statusLabel(job.status)}
									</span>
								</div>
								<p class="queue-author">{getJobAuthor(job)}</p>
							</div>
						</div>
					</div>

					{#if job.status === "processing" && getProgress(job) !== null}
						<div class="queue-progress-wrap">
							<div class="queue-progress-track">
								<div
									class="queue-progress-fill"
									style={`width: ${getProgress(job)}%; background: ${
										getProgress(job) === 100 ? "#4ade80" : "linear-gradient(90deg, #c9a962, #e0c878)"
									}`}
								></div>
							</div>
							<span>{getProgress(job)}%</span>
						</div>
					{/if}

					{#if job.error}
						<p class="queue-error-msg">{job.error}</p>
					{/if}

					<div class="queue-meta-grid">
						<div>
							<span>Created</span>
							<p>{formatQueueDateTime(job.createdAt)}</p>
						</div>
						<div>
							<span>Updated</span>
							<p>{formatQueueDateTime(job.updatedAt)}</p>
						</div>
						{#if job.finishedAt}
							<div>
								<span>Finished</span>
								<p>{formatQueueDateTime(job.finishedAt)}</p>
							</div>
						{/if}
						<div>
							<span>Retries</span>
							<p>
								{job.attempts}/{getRetryLimit(job)}
								{#if job.status === "failed" && job.attempts >= getRetryLimit(job)}
									<em>(max reached)</em>
								{/if}
							</p>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.queue-page {
		padding: 1.5rem 0;
		display: grid;
		gap: 1.5rem;
		color: var(--color-text-primary);
	}

	.error-banner {
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid color-mix(in oklab, var(--color-danger), transparent 80%);
		background: color-mix(in oklab, var(--color-danger), transparent 95%);
		color: var(--color-danger);
	}

	.error-banner p {
		margin: 0;
		font-size: 0.75rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.stat-card {
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border);
		background: #161921;
		display: grid;
		gap: 0.25rem;
	}

	.stat-card p {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.stat-card h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 400;
		line-height: 1.1;
		color: var(--color-text-primary);
	}

	.stat-card h2.queued {
		color: #a0aec0;
	}

	.stat-card h2.processing {
		color: #60a5fa;
	}

	.stat-card h2.completed {
		color: #4ade80;
	}

	.stat-card h2.failed {
		color: #f87171;
	}

	.tabs-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border);
		background: #161921;
		overflow-x: auto;
	}

	.tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid transparent;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		font-weight: 600;
		font-family: inherit;
		white-space: nowrap;
		cursor: pointer;
		transition: background 0.2s ease, color 0.2s ease;
	}

	.tab-btn:hover {
		color: var(--color-text-primary);
	}

	.tab-btn.active {
		background: #1e2230;
		color: var(--color-text-primary);
	}

	.tab-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 0.875rem;
		height: 0.875rem;
	}

	.tab-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.125rem;
		height: 1.125rem;
		padding: 0 0.375rem;
		border-radius: 999px;
		background: #1e2230;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.tab-btn.active .tab-count {
		background: rgba(201, 169, 98, 0.1);
		color: #c9a962;
	}

	.queue-list {
		display: grid;
		gap: 0.5rem;
	}

	.queue-card {
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		background: #161921;
		padding: 1rem;
		display: grid;
		gap: 0.5rem;
	}

	.queue-card.failed {
		border-color: rgba(196, 68, 58, 0.2);
	}

	.queue-head {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 0.75rem;
	}

	.queue-head-left {
		display: flex;
		align-items: start;
		gap: 0.75rem;
		min-width: 0;
	}

	.job-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.job-icon.queued {
		color: #a0aec0;
	}

	.job-icon.processing {
		color: #60a5fa;
	}

	.job-icon.completed {
		color: #4ade80;
	}

	.job-icon.failed {
		color: #f87171;
	}

	.spin-icon {
		animation: queue-spin 1.1s linear infinite;
	}

	@keyframes queue-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.queue-title-block {
		min-width: 0;
		display: grid;
		gap: 0.125rem;
	}

	.queue-title-row {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.queue-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.queue-author {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.queue-status-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.625rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		line-height: 1;
		white-space: nowrap;
		text-transform: capitalize;
	}

	.status-pill-icon {
		margin-left: -0.0625rem;
	}

	.queue-status-pill.queued {
		background: #2a2d3a;
		color: #a0aec0;
	}

	.queue-status-pill.processing {
		background: #1a2a3a;
		color: #60a5fa;
	}

	.queue-status-pill.completed {
		background: #1a2a1a;
		color: #4ade80;
	}

	.queue-status-pill.failed {
		background: #2a1a1a;
		color: #f87171;
	}

	.queue-progress-wrap {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.5rem;
	}

	.queue-progress-track {
		height: 0.375rem;
		border-radius: 999px;
		overflow: hidden;
		background: #1e2230;
	}

	.queue-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #c9a962, #e0c878);
		border-radius: 999px;
	}

	.queue-progress-wrap span {
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--color-text-muted);
		min-width: 2rem;
		text-align: right;
	}

	.queue-error-msg {
		margin: 0;
		padding: 0.375rem 0.5rem;
		border-radius: 0.5rem;
		background: rgba(196, 68, 58, 0.05);
		color: #c4443a;
		font-size: 0.75rem;
	}

	.queue-meta-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.25rem 1rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: rgba(30, 34, 48, 0.2);
	}

	.queue-meta-grid div {
		display: grid;
		gap: 0.125rem;
	}

	.queue-meta-grid span {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
	}

	.queue-meta-grid p {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.queue-meta-grid em {
		font-style: normal;
		color: var(--color-danger);
		margin-left: 0.25rem;
	}

	.empty-state {
		padding: 2.6rem 1.2rem;
		border-radius: 0.75rem;
		border: 1px dashed var(--color-border);
		background: #161921;
		text-align: center;
	}

	.empty-state h3 {
		margin: 0 0 0.25rem;
		font-size: 1.05rem;
		font-weight: 500;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.84rem;
		color: var(--color-text-muted);
	}

	@media (max-width: 1120px) {
		.stats-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.queue-meta-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 760px) {
		.queue-page {
			padding-top: 1rem;
			gap: 1rem;
		}

		.stats-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.queue-card {
			padding: 0.875rem;
		}

		.queue-title {
			font-size: 0.875rem;
		}
	}

	@media (max-width: 560px) {
		.queue-meta-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.tab-btn {
			padding: 0.5rem 0.625rem;
		}
	}
</style>
