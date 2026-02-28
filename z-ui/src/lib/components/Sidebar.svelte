<script lang="ts">
	import { page } from '$app/stores';
	import { menuItems, type MenuItem } from '$lib/types/Navigation';

	interface Props {
		collapsed?: boolean;
		mobileOpen?: boolean;
		onToggle?: () => void;
	}

	let {
		collapsed = $bindable(false),
		mobileOpen = $bindable(false),
		onToggle
	}: Props = $props();

	function isActive(item: MenuItem): boolean {
		return $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/');
	}

	function handleToggle() {
		collapsed = !collapsed;
		onToggle?.();
	}
</script>

<aside class="sidebar" class:collapsed class:mobile-open={mobileOpen}>
	<div class="sidebar-header">
		{#if !collapsed}
			<div class="logo">
				<span class="logo-icon" aria-hidden="true">
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
						<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
						<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
					</svg>
				</span>
				<span class="logo-text">Z-DL</span>
			</div>
		{/if}
		<button class="toggle-btn" onclick={handleToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
			{#if collapsed}
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			{/if}
		</button>
	</div>

	<nav class="sidebar-nav">
		<ul>
			{#each menuItems as item (item.id)}
				<li>
					<a
						href={item.href}
						class:active={isActive(item)}
						title={collapsed ? item.label : undefined}
						onclick={() => (mobileOpen = false)}
					>
						<span class="icon">
							{#if item.icon === 'search'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="11" cy="11" r="8"></circle>
									<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
								</svg>
							{:else if item.icon === 'library'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
									<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
								</svg>
							{:else if item.icon === 'queue'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M16 3h5v5"></path>
									<path d="M4 20l17-17"></path>
									<path d="M21 16v5h-5"></path>
									<path d="M15 21l6-6"></path>
									<path d="M3 8V3h5"></path>
									<path d="M3 3l6 6"></path>
								</svg>
							{:else if item.icon === 'stats'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="12" y1="20" x2="12" y2="10"></line>
									<line x1="18" y1="20" x2="18" y2="4"></line>
									<line x1="6" y1="20" x2="6" y2="16"></line>
								</svg>
							{:else if item.icon === 'archive'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="21 8 21 21 3 21 3 8"></polyline>
									<rect x="1" y="3" width="22" height="5"></rect>
									<line x1="10" y1="12" x2="14" y2="12"></line>
								</svg>
							{:else if item.icon === 'trash'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 6 5 6 21 6"></polyline>
									<path d="M19 6l-1 14H6L5 6"></path>
									<path d="M10 11v6"></path>
									<path d="M14 11v6"></path>
									<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
								</svg>
							{:else if item.icon === 'book'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
									<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
								</svg>
							{:else if item.icon === 'settings'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="12" cy="12" r="3"></circle>
									<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
								</svg>
							{:else if item.icon === 'home'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
									<polyline points="9 22 9 12 15 12 15 22"></polyline>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
									<polyline points="14 2 14 8 20 8"></polyline>
								</svg>
							{/if}
						</span>
						{#if !collapsed}
							<span class="label">{item.label}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<div class="sidebar-footer">
		{#if !collapsed}
			<span class="version">v0.1.0</span>
		{/if}
	</div>
</aside>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		width: var(--sidebar-width);
		height: 100vh;
		position: fixed;
		left: 0;
		top: 0;
		z-index: 100;
		background: var(--color-sidebar);
		border-right: 1px solid rgba(255, 255, 255, 0.06);
		transition: width 0.2s ease;
	}

	.sidebar.collapsed {
		width: var(--sidebar-collapsed-width);
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 4rem;
		padding: 0 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.logo {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		min-width: 0;
	}

	.logo-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 0.58rem;
		background: rgba(201, 169, 98, 0.16);
		color: var(--color-primary);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		border: 1px solid rgba(201, 169, 98, 0.28);
	}

	.logo-text {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		white-space: nowrap;
	}

	.toggle-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 0.52rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: #1a1d27;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.toggle-btn:hover {
		color: var(--color-text-primary);
		border-color: rgba(255, 255, 255, 0.16);
	}

	.sidebar.collapsed .sidebar-header {
		justify-content: center;
		padding: 0 0.35rem;
	}

	.sidebar-nav {
		flex: 1;
		overflow-y: auto;
		padding: 0.8rem 0.5rem;
	}

	.sidebar-nav ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.2rem;
	}

	.sidebar-nav a {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.62rem 0.68rem;
		border-radius: 0.58rem;
		border: 1px solid transparent;
		text-decoration: none;
		color: var(--color-text-secondary);
		font-size: 0.85rem;
		font-weight: 500;
		transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
	}

	.sidebar-nav a:hover {
		background: rgba(255, 255, 255, 0.03);
		color: var(--color-text-primary);
	}

	.sidebar-nav a.active {
		background: #1a1d27;
		color: var(--color-text-primary);
		border-color: rgba(255, 255, 255, 0.06);
	}

	.sidebar.collapsed .sidebar-nav a {
		justify-content: center;
		padding: 0.62rem;
		gap: 0;
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
	}

	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sidebar-footer {
		height: 2.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		padding: 0 0.6rem;
	}

	.version {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	@media (max-width: 900px) {
		.sidebar {
			width: min(84vw, 300px);
			transform: translateX(-105%);
			transition: transform 0.25s ease;
			z-index: 130;
		}

		.sidebar.mobile-open {
			transform: translateX(0);
		}

		.sidebar.collapsed {
			width: min(84vw, 300px);
		}

		.sidebar.collapsed .logo {
			display: inline-flex;
		}

		.sidebar.collapsed .label {
			display: inline;
		}

		.sidebar.collapsed .sidebar-nav a {
			justify-content: flex-start;
			gap: 0.65rem;
		}

		.toggle-btn {
			display: none;
		}
	}
</style>
