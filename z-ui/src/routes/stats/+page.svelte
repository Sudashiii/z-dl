<script lang="ts">
	import { onMount } from 'svelte';
	import Loading from '$lib/components/Loading.svelte';
	import { ZUI } from '$lib/client/zui';
	import type { ApiError } from '$lib/types/ApiError';
	import type { LibraryBook } from '$lib/types/Library/Book';
	import type {
		ReadingActivityDay,
		ReadingActivityStats
	} from '$lib/types/Stats/ReadingActivityStats';

	type DailyRange = 7 | 14 | 30;
	type BookStatus = 'Unread' | 'Reading' | 'Completed';

	const DAILY_RANGES: DailyRange[] = [7, 14, 30];
	const FORMAT_COLORS = ['#60a5fa', '#c084fc', '#c9a962', '#4ade80', '#f87171'];
	const STATUS_COLORS: Record<BookStatus, string> = {
		Unread: '#3a3d4a',
		Reading: '#c9a962',
		Completed: '#4ade80'
	};

	let isLoading = $state(true);
	let error = $state<ApiError | null>(null);
	let books = $state<LibraryBook[]>([]);
	let activity = $state<ReadingActivityStats | null>(null);
	let dailyRange = $state<DailyRange>(30);

	onMount(() => {
		void loadStats();
	});

	async function loadStats(): Promise<void> {
		isLoading = true;
		error = null;

		const [libraryResult, activityResult] = await Promise.all([
			ZUI.getLibrary(),
			ZUI.getReadingActivityStats(365)
		]);

		if (!libraryResult.ok) {
			error = libraryResult.error;
			isLoading = false;
			return;
		}

		if (!activityResult.ok) {
			error = activityResult.error;
			isLoading = false;
			return;
		}

		books = libraryResult.value.books;
		activity = activityResult.value;
		isLoading = false;
	}

	function getBookStatus(book: LibraryBook): BookStatus {
		if (book.read_at) return 'Completed';
		if ((book.progressPercent ?? 0) > 0) return 'Reading';
		return 'Unread';
	}

	function getFormat(book: LibraryBook): string {
		return (book.extension ?? 'UNKNOWN').toUpperCase();
	}

	function formatDate(dateInput: string | null | undefined): string {
		if (!dateInput) return '—';
		return new Date(dateInput).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatNumber(value: number): string {
		return value.toLocaleString('en-US');
	}

	function toDailyLabel(dateKey: string): string {
		const date = new Date(`${dateKey}T00:00:00.000Z`);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
	}

	function getHeatColor(pages: number, maxPages: number): string {
		if (pages === 0 || maxPages <= 0) return '#1e2230';
		const ratio = pages / maxPages;
		if (ratio < 0.15) return '#2a2518';
		if (ratio < 0.3) return '#3d3520';
		if (ratio < 0.5) return '#5a4a2a';
		if (ratio < 0.7) return '#8a7540';
		return '#c9a962';
	}

	function buildHeatmap(input: ReadingActivityDay[]): {
		weeks: Array<Array<{ date: string; pagesRead: number } | null>>;
		monthLabels: Array<{ label: string; col: number }>;
		maxPages: number;
	} {
		if (input.length === 0) {
			return { weeks: [], monthLabels: [], maxPages: 0 };
		}

		const dateMap = new Map(input.map((entry) => [entry.date, entry.pagesRead]));
		const start = new Date(`${input[0].date}T00:00:00.000Z`);
		const end = new Date(`${input[input.length - 1].date}T00:00:00.000Z`);
		const adjustedStart = new Date(start);
		while (adjustedStart.getUTCDay() !== 1) {
			adjustedStart.setUTCDate(adjustedStart.getUTCDate() - 1);
		}

		const weeks: Array<Array<{ date: string; pagesRead: number } | null>> = [];
		const monthLabels: Array<{ label: string; col: number }> = [];
		let maxPages = 0;
		let week: Array<{ date: string; pagesRead: number } | null> = Array(7).fill(null);
		let weekIndex = 0;
		let lastMonth = '';
		let cursor = new Date(adjustedStart);

		while (cursor <= end) {
			const dateKey = cursor.toISOString().slice(0, 10);
			const dayOfWeek = cursor.getUTCDay() === 0 ? 6 : cursor.getUTCDay() - 1;
			const pagesRead = dateMap.get(dateKey) ?? 0;
			maxPages = Math.max(maxPages, pagesRead);

			if (dateMap.has(dateKey)) {
				week[dayOfWeek] = { date: dateKey, pagesRead };
			}

			const monthKey = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}`;
			if (monthKey !== lastMonth) {
				const nextLabel = {
					label: cursor.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
					col: weekIndex
				};

				// A month boundary can happen within the same week column.
				// Replace the previous label for that column to avoid overlapping text.
				const previousLabel = monthLabels[monthLabels.length - 1];
				if (previousLabel && previousLabel.col === nextLabel.col) {
					monthLabels[monthLabels.length - 1] = nextLabel;
				} else {
					monthLabels.push(nextLabel);
				}
				lastMonth = monthKey;
			}

			if (dayOfWeek === 6) {
				weeks.push(week);
				week = Array(7).fill(null);
				weekIndex += 1;
			}

			cursor.setUTCDate(cursor.getUTCDate() + 1);
		}

		if (week.some((cell) => cell !== null)) {
			weeks.push(week);
		}

		return { weeks, monthLabels, maxPages };
	}

	function buildConicGradient(entries: Array<{ value: number }>, colors: string[]): string {
		const total = entries.reduce((sum, entry) => sum + entry.value, 0);
		if (total <= 0) {
			return '#1e2230';
		}

		let offset = 0;
		const segments = entries.map((entry, index) => {
			const start = (offset / total) * 360;
			offset += entry.value;
			const end = (offset / total) * 360;
			return `${colors[index % colors.length]} ${start}deg ${end}deg`;
		});

		return `conic-gradient(${segments.join(', ')})`;
	}

	let completedBooksCount = $derived(books.filter((book) => Boolean(book.read_at)).length);
	let readingBooksCount = $derived(books.filter((book) => getBookStatus(book) === 'Reading').length);
	let unreadBooksCount = $derived(books.filter((book) => getBookStatus(book) === 'Unread').length);

	let booksByFormat = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const book of books) {
			const format = getFormat(book);
			counts.set(format, (counts.get(format) ?? 0) + 1);
		}
		return Array.from(counts.entries())
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);
	});

	let booksByStatus = $derived([
		{ name: 'Unread' as BookStatus, value: unreadBooksCount },
		{ name: 'Reading' as BookStatus, value: readingBooksCount },
		{ name: 'Completed' as BookStatus, value: completedBooksCount }
	]);

	let ratingDistribution = $derived.by(() => {
		const counts = [0, 0, 0, 0, 0, 0];
		for (const book of books) {
			const rating = book.rating ?? 0;
			if (rating >= 1 && rating <= 5) {
				counts[rating] += 1;
			}
		}
		return [1, 2, 3, 4, 5].map((rating) => ({ label: `${rating}★`, value: counts[rating] }));
	});

	let recentDaily = $derived.by(() => {
		if (!activity) return [];
		return activity.daily.slice(-dailyRange).map((entry) => ({
			...entry,
			label: toDailyLabel(entry.date)
		}));
	});

	let recentWeekly = $derived.by(() => {
		if (!activity) return [];
		return activity.weekly.slice(-12);
	});

	let recentMonthly = $derived.by(() => {
		if (!activity) return [];
		return activity.monthly;
	});

	let heatmap = $derived.by(() => buildHeatmap(activity?.daily ?? []));

	let maxDailyPages = $derived(Math.max(...recentDaily.map((entry) => entry.pagesRead), 1));
	let maxWeeklyPages = $derived(Math.max(...recentWeekly.map((entry) => entry.pages), 1));
	let maxHourlyPages = $derived(Math.max(...(activity?.hourly ?? []).map((entry) => entry.pages), 1));
	let maxMonthlyPages = $derived(Math.max(...recentMonthly.map((entry) => entry.pages), 1));
	let maxRatingCount = $derived(Math.max(...ratingDistribution.map((entry) => entry.value), 1));
	let maxStatusCount = $derived(Math.max(...booksByStatus.map((entry) => entry.value), 1));

	let readingPercentage = $derived.by(() => {
		if (!activity || activity.totals.totalDays <= 0) return 0;
		return Math.round((activity.totals.daysActive / activity.totals.totalDays) * 100);
	});

	let formatPieGradient = $derived(buildConicGradient(booksByFormat, FORMAT_COLORS));

	let streakPreviewCells = $derived.by(() => {
		if (!activity) return [] as number[];
		const count = Math.min(activity.streak.current, 14);
		return Array.from({ length: count }, (_, index) => index);
	});
</script>

<div class="stats-page">
	<Loading bind:show={isLoading} />

	{#if error}
		<div class="error-banner">
			<p>{error.message}</p>
			<button onclick={loadStats}>Retry</button>
		</div>
	{/if}

	{#if activity}
		<section class="summary-grid" aria-label="Summary stats">
			<article class="summary-card">
				<p>Total Pages Read</p>
				<h2>{formatNumber(activity.totals.totalPages)}</h2>
				<span>{activity.totals.avgPagesPerDay} avg/day</span>
			</article>
			<article class="summary-card">
				<p>Current Streak</p>
				<h2 class="accent-red">{activity.streak.current} days</h2>
				<span>Longest: {activity.streak.longest} days</span>
			</article>
			<article class="summary-card">
				<p>Days Active</p>
				<h2 class="accent-green">{activity.totals.daysActive}</h2>
				<span>{readingPercentage}% of days</span>
			</article>
			<article class="summary-card">
				<p>Books Completed</p>
				<h2 class="accent-blue">{completedBooksCount}</h2>
				<span>{books.length} books in library</span>
			</article>
		</section>

		<section class="highlight-grid" aria-label="Highlights">
			<article class="highlight-card">
				<p>Best Reading Day</p>
				<h3>{activity.totals.bestDay.pagesRead} pages</h3>
				<span>{formatDate(activity.totals.bestDay.date)}</span>
			</article>
			<article class="highlight-card">
				<p>Avg on Active Days</p>
				<h3>{activity.totals.avgPagesOnActiveDay} pages</h3>
				<span>{formatNumber(activity.totals.totalSessions)} progress snapshots</span>
			</article>
			<article class="highlight-card">
				<p>Reading Mix</p>
				<h3>{readingBooksCount} reading / {unreadBooksCount} unread</h3>
				<span>{completedBooksCount} completed</span>
			</article>
		</section>

		<section class="card heatmap-card">
			<div class="card-head">
				<h3>Reading Activity</h3>
				<p>{formatNumber(activity.totals.totalPages)} pages in the last year</p>
			</div>

			{#if heatmap.weeks.length > 0}
				<div class="heatmap-shell">
					<div class="heatmap-scroll">
						<div class="heatmap-inner" style={`--heatmap-weeks: ${heatmap.weeks.length}`}>
							<div class="month-labels">
								{#each heatmap.monthLabels as label}
									<span style={`left: ${label.col * 16}px`}>{label.label}</span>
								{/each}
							</div>

							<div class="heatmap-grid-wrap">
								<div class="day-labels">
									<span>Mon</span>
									<span></span>
									<span>Wed</span>
									<span></span>
									<span>Fri</span>
									<span></span>
									<span>Sun</span>
								</div>
								<div class="heatmap-weeks">
									{#each heatmap.weeks as week}
										<div class="heatmap-week">
											{#each week as cell}
												{#if cell}
													<button
														type="button"
														class="heat-cell"
														style={`background: ${getHeatColor(cell.pagesRead, heatmap.maxPages)}`}
														data-tooltip={`${cell.date}: ${cell.pagesRead} page${cell.pagesRead === 1 ? '' : 's'}`}
														aria-label={`${cell.date}: ${cell.pagesRead} page${cell.pagesRead === 1 ? '' : 's'}`}
													></button>
												{:else}
													<div class="heat-cell empty"></div>
												{/if}
											{/each}
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>

					<div class="heat-legend">
						<span>Less</span>
						{#each [0, 0.15, 0.3, 0.5, 0.7, 1] as ratio}
							<div style={`background: ${ratio === 0 ? '#1e2230' : getHeatColor(heatmap.maxPages * ratio, heatmap.maxPages)}`}></div>
						{/each}
						<span>More</span>
					</div>
				</div>
			{/if}
		</section>

		<section class="card">
			<div class="card-head">
				<h3>Pages Per Day</h3>
				<div class="range-switch">
					{#each DAILY_RANGES as range}
						<button type="button" class:active={dailyRange === range} onclick={() => (dailyRange = range)}>
							{range}d
						</button>
					{/each}
				</div>
			</div>

			<div class="bar-chart" data-compact={dailyRange === 30}>
				{#each recentDaily as item}
					<div class="bar-col" title={`${formatDate(item.date)}: ${item.pagesRead} pages`}>
						<div class="bar-track">
							<div class="bar-fill gold" style={`height: ${(item.pagesRead / maxDailyPages) * 100}%`}></div>
						</div>
						<span>{item.label}</span>
					</div>
				{/each}
			</div>
		</section>

		<section class="split-grid">
			<article class="card">
				<div class="card-head">
					<h3>Weekly Trend</h3>
				</div>
				<div class="bar-chart weekly-chart">
					{#each recentWeekly as item}
						<div class="bar-col" title={`${item.week}: ${item.pages} pages`}>
							<div class="bar-track">
								<div class="bar-fill gold-soft" style={`height: ${(item.pages / maxWeeklyPages) * 100}%`}></div>
							</div>
							<span>{item.week}</span>
						</div>
					{/each}
				</div>
			</article>

			<article class="card">
				<div class="card-head">
					<h3>Reading by Time of Day</h3>
				</div>
				<div class="bar-chart hourly-chart">
					{#each activity.hourly as item}
						<div class="bar-col" title={`${item.label}: ${item.pages} pages`}>
							<div class="bar-track">
								<div class="bar-fill blue" style={`height: ${(item.pages / maxHourlyPages) * 100}%`}></div>
							</div>
							<span>{item.label}</span>
						</div>
					{/each}
				</div>
			</article>
		</section>

		<section class="split-grid monthly-grid">
			<article class="card monthly-card">
				<div class="card-head">
					<h3>Monthly Overview</h3>
				</div>
				<div class="monthly-bars">
					{#each recentMonthly as month}
						<div class="monthly-row" title={`${month.month}: ${month.pages} pages, ${month.booksFinished} books finished`}>
							<div class="month-label">{month.month}</div>
							<div class="month-track">
								<div class="month-fill" style={`width: ${(month.pages / maxMonthlyPages) * 100}%`}></div>
							</div>
							<div class="month-values">
								<span>{formatNumber(month.pages)}</span>
								<em>{month.booksFinished}</em>
							</div>
						</div>
					{/each}
				</div>

				<div class="monthly-table-wrap">
					<table>
						<thead>
							<tr>
								<th>Month</th>
								<th>Pages</th>
								<th>Avg/Day</th>
								<th>Books Done</th>
							</tr>
						</thead>
						<tbody>
							{#each [...recentMonthly].slice(-6).reverse() as month}
								<tr>
									<td>{month.month}</td>
									<td>{formatNumber(month.pages)}</td>
									<td>{month.avgPagesPerDay}</td>
									<td>{month.booksFinished > 0 ? month.booksFinished : '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</article>

			<div class="distribution-stack">
				<article class="card">
					<div class="card-head"><h3>Books by Format</h3></div>
					<div class="pie-wrap">
						<div class="pie" style={`background: ${formatPieGradient}`}></div>
						<div class="pie-hole"></div>
					</div>
					<div class="legend-grid">
						{#each booksByFormat as format, index}
							<div>
								<span style={`background: ${FORMAT_COLORS[index % FORMAT_COLORS.length]}`}></span>
								<p>{format.name} ({format.value})</p>
							</div>
						{/each}
					</div>
				</article>

				<article class="card">
					<div class="card-head"><h3>Rating Distribution</h3></div>
					<div class="rating-bars">
						{#each ratingDistribution as rating}
							<div class="rating-row" title={`${rating.label}: ${rating.value} books`}>
								<span>{rating.label}</span>
								<div class="rating-track">
									<div class="rating-fill" style={`width: ${(rating.value / maxRatingCount) * 100}%`}></div>
								</div>
								<em>{rating.value}</em>
							</div>
						{/each}
					</div>
				</article>

				<article class="card">
					<div class="card-head"><h3>Books by Status</h3></div>
					<div class="status-bars">
						{#each booksByStatus as status}
							{@const pct = books.length > 0 ? Math.round((status.value / books.length) * 100) : 0}
							<div class="status-row">
								<div class="status-head">
									<span>{status.name}</span>
									<em>{status.value} ({pct}%)</em>
								</div>
								<div class="status-track">
									<div class="status-fill" style={`width: ${(status.value / maxStatusCount) * 100}%; background: ${STATUS_COLORS[status.name]}`}></div>
								</div>
							</div>
						{/each}
					</div>
				</article>
			</div>
		</section>

		<section class="card streak-card">
			<div class="card-head"><h3>Reading Streaks</h3></div>
			<div class="streak-grid">
				<div class="streak-box">
					<p>Current Streak</p>
					<div class="streak-main"><strong>{activity.streak.current}</strong><span>days</span></div>
					<div class="streak-cells">
						{#each streakPreviewCells as cell}
							<div style={`opacity: ${0.3 + (cell / Math.max(streakPreviewCells.length, 1)) * 0.7}`}></div>
						{/each}
						{#if activity.streak.current > 14}
							<em>+{activity.streak.current - 14}</em>
						{/if}
					</div>
				</div>
				<div class="streak-box">
					<p>Longest Streak</p>
					<div class="streak-main"><strong>{activity.streak.longest}</strong><span>days</span></div>
					<div class="streak-range">
						{#if activity.streak.longestStart && activity.streak.longestEnd}
							{formatDate(activity.streak.longestStart)} — {formatDate(activity.streak.longestEnd)}
						{:else}
							—
						{/if}
					</div>
				</div>
			</div>
		</section>
	{/if}
</div>

	<style>
	.stats-page {
		padding: 1.5rem 0;
		display: grid;
		gap: 1.5rem;
		color: var(--color-text-primary);
		min-width: 0;
		overflow-x: hidden;
	}

	.stats-page > * {
		min-width: 0;
	}

	.error-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid color-mix(in oklab, var(--color-danger), transparent 80%);
		background: color-mix(in oklab, var(--color-danger), transparent 95%);
		color: var(--color-danger);
	}

	.error-banner p {
		margin: 0;
		font-size: 0.8rem;
	}

	.error-banner button {
		padding: 0.35rem 0.7rem;
		border-radius: 0.5rem;
		border: 1px solid color-mix(in oklab, var(--color-danger), transparent 65%);
		background: transparent;
		color: var(--color-danger);
		font-size: 0.75rem;
		font-family: inherit;
		cursor: pointer;
	}

	.summary-grid,
	.highlight-grid,
	.split-grid,
	.streak-grid {
		display: grid;
		gap: 0.75rem;
	}

	.summary-grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.summary-card,
	.highlight-card,
	.card {
		background: #161921;
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 1rem;
		min-width: 0;
	}

	.summary-card p,
	.highlight-card p {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.summary-card h2 {
		margin: 0.25rem 0 0;
		font-size: 1.55rem;
		font-weight: 500;
		line-height: 1.15;
	}

	.summary-card h2.accent-red {
		color: #f87171;
	}

	.summary-card h2.accent-green {
		color: #4ade80;
	}

	.summary-card h2.accent-blue {
		color: #60a5fa;
	}

	.summary-card span,
	.highlight-card span {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.72rem;
		color: var(--color-text-muted);
	}

	.highlight-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.highlight-card h3 {
		margin: 0.3rem 0 0;
		font-size: 1rem;
		font-weight: 500;
		line-height: 1.2;
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
		min-width: 0;
	}

	.card-head h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.card-head p {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		max-width: 100%;
	}

	.range-switch {
		display: inline-flex;
		align-items: center;
		background: #1e2230;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 0.125rem;
		gap: 0.125rem;
	}

	.range-switch button {
		padding: 0.28rem 0.52rem;
		border-radius: 0.36rem;
		border: 0;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.7rem;
		font-family: inherit;
		cursor: pointer;
	}

	.range-switch button.active {
		background: #161921;
		color: var(--color-text-primary);
	}

	.heatmap-shell {
		position: relative;
		min-width: 0;
	}

	.heatmap-scroll {
		overflow-x: auto;
		overflow-y: visible;
		padding-bottom: 0.2rem;
		padding-top: 1.95rem;
		margin-top: -1.95rem;
	}

	.heatmap-inner {
		width: max(100%, calc(var(--heatmap-weeks, 0) * 16px + 1.75rem));
	}

	.heatmap-inner,
	.heatmap-grid-wrap,
	.heatmap-weeks {
		min-width: 0;
	}

	.month-labels {
		position: relative;
		height: 1rem;
		margin-left: 1.75rem;
	}

	.month-labels span {
		position: absolute;
		top: 0;
		font-size: 0.62rem;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.heatmap-grid-wrap {
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
		margin-top: 0.25rem;
	}

	.day-labels {
		display: grid;
		grid-template-rows: repeat(7, 13px);
		row-gap: 3px;
		width: 1.4rem;
	}

	.day-labels span {
		font-size: 0.62rem;
		color: var(--color-text-muted);
		line-height: 13px;
	}

	.heatmap-weeks {
		display: flex;
		gap: 3px;
	}

	.heatmap-week {
		display: grid;
		grid-template-rows: repeat(7, 13px);
		row-gap: 3px;
	}

	.heat-cell {
		width: 13px;
		height: 13px;
		border-radius: 3px;
		border: 0;
		padding: 0;
		cursor: pointer;
		position: relative;
	}

	.heat-cell.empty {
		background: transparent;
	}

	.heat-cell:not(.empty)::after {
		content: attr(data-tooltip);
		position: absolute;
		left: 50%;
		bottom: calc(100% + 0.45rem);
		transform: translateX(-50%);
		background: #0f1420;
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		padding: 0.3rem 0.42rem;
		font-size: 0.62rem;
		line-height: 1.1;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 80ms ease;
		z-index: 3;
	}

	.heat-cell:not(.empty):hover::after,
	.heat-cell:not(.empty):focus-visible::after {
		opacity: 1;
	}

	.heat-cell:not(.empty):focus-visible {
		outline: 1px solid #60a5fa;
		outline-offset: 1px;
	}

	.heat-legend {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.28rem;
		margin-top: 0.75rem;
	}

	.heat-legend span {
		font-size: 0.62rem;
		color: var(--color-text-muted);
	}

	.heat-legend div {
		width: 11px;
		height: 11px;
		border-radius: 2px;
	}

	.bar-chart {
		display: flex;
		align-items: flex-end;
		gap: 0.34rem;
		min-height: 12rem;
		overflow-x: auto;
		padding-bottom: 0.15rem;
		min-width: 0;
	}

	.bar-col {
		display: grid;
		justify-items: center;
		gap: 0.3rem;
		min-width: 1.1rem;
		flex: 0 0 auto;
	}

	.bar-track {
		width: 100%;
		height: 10.2rem;
		background: #1e2230;
		border-radius: 0.35rem;
		overflow: hidden;
		display: flex;
		align-items: flex-end;
	}

	.bar-fill {
		width: 100%;
		border-radius: 0.35rem;
	}

	.bar-fill.gold {
		background: #c9a962;
	}

	.bar-fill.gold-soft {
		background: color-mix(in oklab, #c9a962, #ffffff 8%);
	}

	.bar-fill.blue {
		background: #60a5fa;
	}

	.bar-col span {
		font-size: 0.62rem;
		color: var(--color-text-muted);
		text-align: center;
		line-height: 1.1;
		max-width: 2.4rem;
	}

	.bar-chart[data-compact='true'] .bar-col span {
		max-width: 2.2rem;
	}

	.bar-chart[data-compact='true'] .bar-col {
		flex: 1 1 0;
		min-width: 1.45rem;
	}

	.bar-chart[data-compact='false'] .bar-col {
		flex: 1 1 0;
		min-width: 2.8rem;
	}

	.bar-chart[data-compact='false'] .bar-col span {
		max-width: none;
		white-space: nowrap;
	}

	.weekly-chart .bar-track,
	.hourly-chart .bar-track {
		height: 9rem;
	}

	.weekly-chart {
		gap: 0.36rem;
	}

	.weekly-chart .bar-col {
		flex: 1 1 0;
		min-width: 2.2rem;
	}

	.weekly-chart .bar-col span {
		max-width: 3.1rem;
		white-space: normal;
	}

	.hourly-chart {
		gap: 0.48rem;
		padding-bottom: 0.3rem;
	}

	.hourly-chart .bar-col {
		min-width: 1.5rem;
		gap: 0.38rem;
	}

	.hourly-chart .bar-col span {
		min-width: 2rem;
		max-width: none;
		white-space: nowrap;
		font-size: 0.66rem;
	}

	.split-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.monthly-grid {
		align-items: start;
	}

	.monthly-card {
		display: grid;
		gap: 1rem;
	}

	.monthly-bars {
		display: grid;
		gap: 0.45rem;
	}

	.monthly-row {
		display: grid;
		grid-template-columns: 6.6rem 1fr auto;
		align-items: center;
		gap: 0.6rem;
	}

	.month-label {
		font-size: 0.72rem;
		color: var(--color-text-secondary);
	}

	.month-track {
		height: 0.45rem;
		border-radius: 999px;
		overflow: hidden;
		background: #1e2230;
	}

	.month-fill {
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, #c9a962, #e0c878);
	}

	.month-values {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		font-size: 0.7rem;
	}

	.month-values span {
		color: var(--color-text-secondary);
	}

	.month-values em {
		font-style: normal;
		color: #4ade80;
	}

	.monthly-table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.74rem;
	}

	thead th {
		text-align: right;
		padding: 0.42rem 0.5rem;
		color: var(--color-text-muted);
		font-weight: 500;
		border-bottom: 1px solid var(--color-border);
	}

	thead th:first-child,
	tbody td:first-child {
		text-align: left;
		padding-left: 0;
	}

	tbody td {
		padding: 0.42rem 0.5rem;
		text-align: right;
		border-bottom: 1px solid color-mix(in oklab, var(--color-border), transparent 45%);
		color: var(--color-text-secondary);
	}

	tbody tr:last-child td {
		border-bottom: 0;
	}

	.distribution-stack {
		display: grid;
		gap: 0.75rem;
	}

	.pie-wrap {
		position: relative;
		width: 8.4rem;
		height: 8.4rem;
		margin: 0 auto;
	}

	.pie,
	.pie-hole {
		position: absolute;
		inset: 0;
		border-radius: 50%;
	}

	.pie-hole {
		inset: 28%;
		background: #161921;
		border: 1px solid var(--color-border);
	}

	.legend-grid {
		display: grid;
		gap: 0.4rem;
		margin-top: 0.8rem;
	}

	.legend-grid div {
		display: inline-flex;
		align-items: center;
		gap: 0.38rem;
	}

	.legend-grid span {
		display: inline-block;
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 2px;
	}

	.legend-grid p {
		margin: 0;
		font-size: 0.72rem;
		color: var(--color-text-muted);
	}

	.rating-bars,
	.status-bars {
		display: grid;
		gap: 0.5rem;
	}

	.rating-row {
		display: grid;
		grid-template-columns: 2.2rem 1fr auto;
		align-items: center;
		gap: 0.5rem;
	}

	.rating-row span,
	.rating-row em {
		font-size: 0.72rem;
		font-style: normal;
	}

	.rating-row span {
		color: var(--color-text-secondary);
	}

	.rating-row em {
		color: var(--color-text-muted);
	}

	.rating-track,
	.status-track {
		height: 0.38rem;
		border-radius: 999px;
		overflow: hidden;
		background: #1e2230;
	}

	.rating-fill {
		height: 100%;
		border-radius: 999px;
		background: #c9a962;
	}

	.status-row {
		display: grid;
		gap: 0.22rem;
	}

	.status-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.status-head span,
	.status-head em {
		font-size: 0.72rem;
	}

	.status-head span {
		color: var(--color-text-secondary);
	}

	.status-head em {
		font-style: normal;
		color: var(--color-text-muted);
	}

	.status-fill {
		height: 100%;
		border-radius: 999px;
	}

	.streak-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.streak-box {
		background: color-mix(in oklab, var(--color-secondary), transparent 70%);
		border: 1px solid color-mix(in oklab, var(--color-border), transparent 20%);
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.streak-box > p {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.streak-main {
		display: inline-flex;
		align-items: baseline;
		gap: 0.35rem;
		margin-top: 0.45rem;
	}

	.streak-main strong {
		font-size: 2rem;
		line-height: 1;
		font-weight: 500;
	}

	.streak-main span {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.streak-cells {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		margin-top: 0.6rem;
	}

	.streak-cells div {
		width: 0.68rem;
		height: 0.68rem;
		border-radius: 2px;
		background: #f87171;
	}

	.streak-cells em,
	.streak-range {
		font-style: normal;
		font-size: 0.72rem;
		color: var(--color-text-muted);
	}

	.streak-range {
		margin-top: 0.6rem;
	}

	@media (max-width: 1240px) {
		.summary-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.split-grid,
		.streak-grid,
		.highlight-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (max-width: 760px) {
		.stats-page {
			padding-top: 1rem;
			gap: 1rem;
		}

		.summary-card,
		.highlight-card,
		.card {
			padding: 0.85rem;
		}

		.summary-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.summary-card h2 {
			font-size: 1.35rem;
		}

		.card-head {
			flex-direction: column;
			align-items: flex-start;
		}

		.range-switch {
			width: 100%;
			justify-content: flex-start;
		}

		.heatmap-inner {
			width: calc(var(--heatmap-weeks, 0) * 16px + 1.75rem);
			min-width: max-content;
		}

		.monthly-row {
			grid-template-columns: 1fr;
			gap: 0.32rem;
		}

		.month-values {
			justify-content: space-between;
		}

		.bar-col {
			min-width: 0.95rem;
		}

		.monthly-table-wrap table {
			min-width: 440px;
		}
	}

	@media (max-width: 560px) {
		.stats-page {
			padding-top: 0.8rem;
			gap: 0.85rem;
		}

		.error-banner {
			flex-direction: column;
			align-items: flex-start;
		}

		.bar-track {
			height: 8.4rem;
		}

		.weekly-chart .bar-track,
		.hourly-chart .bar-track {
			height: 7.2rem;
		}

		.weekly-chart .bar-col {
			min-width: 1.95rem;
		}

		.bar-chart[data-compact='false'] .bar-col {
			min-width: 2.25rem;
		}

		.bar-chart[data-compact='true'] .bar-col {
			min-width: 1.15rem;
		}

		.hourly-chart {
			gap: 0.38rem;
		}

		.hourly-chart .bar-col {
			min-width: 1.35rem;
		}

		.hourly-chart .bar-col span {
			min-width: 1.75rem;
		}

		.streak-main strong {
			font-size: 1.65rem;
		}

		.streak-range {
			overflow-wrap: anywhere;
		}
	}
</style>
