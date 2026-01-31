<script lang="ts">
	import { page } from '$app/stores';
	import { menuItems, type MenuItem } from '$lib/types/Navigation';

	interface Props {
		collapsed?: boolean;
		onToggle?: () => void;
	}

	let { collapsed = $bindable(false), onToggle }: Props = $props();

	function isActive(item: MenuItem): boolean {
		return $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/');
	}

	function handleToggle() {
		collapsed = !collapsed;
		onToggle?.();
	}
</script>

<aside class="sidebar" class:collapsed>
	<div class="sidebar-header">
		{#if !collapsed}
			<div class="logo">
				<span class="logo-icon">📚</span>
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
					<a href={item.href} class:active={isActive(item)} title={collapsed ? item.label : undefined}>
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
		width: var(--sidebar-width, 240px);
		height: 100vh;
		background: linear-gradient(180deg, rgb(18, 24, 32) 0%, rgb(15, 20, 26) 100%);
		border-right: 1px solid rgba(255, 255, 255, 0.06);
		transition: width 0.25s ease;
		position: fixed;
		left: 0;
		top: 0;
		z-index: 100;
	}

	.sidebar.collapsed {
		width: var(--sidebar-collapsed-width, 60px);
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		min-height: 64px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.logo-icon {
		font-size: 1.5rem;
	}

	.logo-text {
		font-size: 1.25rem;
		font-weight: 700;
		background: linear-gradient(135deg, #fff, #94a3b8);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		white-space: nowrap;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.toggle-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		border-color: rgba(255, 255, 255, 0.15);
	}

	.sidebar.collapsed .sidebar-header {
		justify-content: center;
		padding: 1.25rem 0.5rem;
	}

	.sidebar-nav {
		flex: 1;
		padding: 1rem 0;
		overflow-y: auto;
	}

	.sidebar-nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.sidebar-nav li {
		margin: 0.25rem 0;
	}

	.sidebar-nav a {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.75rem 1rem;
		color: rgba(255, 255, 255, 0.6);
		text-decoration: none;
		border-radius: 10px;
		margin: 0 0.5rem;
		transition: all 0.2s ease;
		position: relative;
	}

	.sidebar-nav a:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #fff;
	}

	.sidebar-nav a.active {
		background: rgba(30, 144, 255, 0.15);
		color: #1e90ff;
	}

	.sidebar-nav a.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 3px;
		height: 60%;
		background: #1e90ff;
		border-radius: 0 2px 2px 0;
	}

	.sidebar.collapsed .sidebar-nav a {
		justify-content: center;
		padding: 0.75rem;
		margin: 0 0.375rem;
	}

	.sidebar.collapsed .sidebar-nav a.active::before {
		display: none;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		text-align: center;
	}

	.version {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.sidebar.collapsed .sidebar-footer {
		padding: 0.75rem 0.5rem;
	}
</style>
