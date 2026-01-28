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

	function getIcon(iconName: string | undefined): string {
		switch (iconName) {
			case 'search':
				return '🔍';
			case 'library':
				return '📚';
			case 'book':
				return '📖';
			case 'settings':
				return '⚙️';
			case 'home':
				return '🏠';
			default:
				return '📄';
		}
	}
</script>

<aside class="sidebar" class:collapsed>
	<div class="sidebar-header">
		{#if !collapsed}
			<span class="logo">Z-DL</span>
		{/if}
		<button class="toggle-btn" onclick={handleToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
			<span class="toggle-icon">{collapsed ? '→' : '←'}</span>
		</button>
	</div>

	<nav class="sidebar-nav">
		<ul>
			{#each menuItems as item (item.id)}
				<li>
					<a href={item.href} class:active={isActive(item)} title={collapsed ? item.label : undefined}>
						<span class="icon">{getIcon(item.icon)}</span>
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
		width: 240px;
		height: 100vh;
		background: rgb(22, 30, 39);
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		transition: width 0.2s ease;
		position: fixed;
		left: 0;
		top: 0;
		z-index: 100;
	}

	.sidebar.collapsed {
		width: 60px;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		min-height: 60px;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 6px;
		color: #fff;
		cursor: pointer;
		transition: background 0.2s;
		flex-shrink: 0;
	}

	.toggle-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.toggle-icon {
		font-size: 0.9rem;
	}

	.sidebar.collapsed .sidebar-header {
		justify-content: center;
		padding: 1rem 0.5rem;
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
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		border-radius: 8px;
		margin: 0 0.5rem;
		transition: all 0.2s;
	}

	.sidebar-nav a:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.sidebar-nav a.active {
		background: rgba(30, 144, 255, 0.2);
		color: #1e90ff;
	}

	.sidebar.collapsed .sidebar-nav a {
		justify-content: center;
		padding: 0.75rem;
		margin: 0 0.25rem;
	}

	.icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
	}

	.version {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.sidebar.collapsed .sidebar-footer {
		padding: 0.5rem;
	}
</style>
