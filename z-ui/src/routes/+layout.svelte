<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { onMount } from "svelte";
	import favicon from "$lib/assets/favicon.svg";
	import { ZUI } from "$lib/client/zui";
	import { ZLibAuthService } from "$lib/client/services/zlibAuthService";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import type { ApiError } from "$lib/types/ApiError";
	import type { Snippet } from "svelte";

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();

	const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";

	let showModal = $state(false);
	let username = $state("");
	let password = $state("");
	let zlibName = $state("");
	let loginWithToken = $state(false);
	let isLoading = $state(false);
	let error = $state<ApiError | null>(null);
	let sidebarCollapsed = $state(false);
	let sidebarMobileOpen = $state(false);

	// Check if we're on the login page (don't show sidebar there)
	let isLoginPage = $derived($page.url.pathname === "/");

	function openModal() {
		error = null;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		username = "";
		password = "";
		error = null;
	}

	async function handleLogin() {
		if (!username || !password) {
			return;
		}

		isLoading = true;
		error = null;

		if (loginWithToken) {
			const result = await ZLibAuthService.tokenLogin(username, password);
			if (!result.ok) {
				error = result.error;
			} else {
				closeModal();
			}
		} else {
			const result = await ZLibAuthService.passwordLogin(
				username,
				password,
			);
			if (result.ok) {
				zlibName = result.value.user.name;
				closeModal();
			} else {
				error = result.error;
			}
		}

		isLoading = false;
	}

	function handleLogout() {
		ZLibAuthService.clearUserName();
		zlibName = "";
	}

	function handleSidebarToggle() {
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(
				SIDEBAR_COLLAPSED_KEY,
				String(sidebarCollapsed),
			);
		}
	}

	function toggleMobileSidebar() {
		sidebarMobileOpen = !sidebarMobileOpen;
	}

	function handleKeyDown(event: KeyboardEvent, action: () => void) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			action();
		}
	}

	function handleModalClick(event: MouseEvent) {
		event.stopPropagation();
	}

	onMount(async () => {
		zlibName = ZLibAuthService.getStoredUserName();

		// Restore sidebar state
		if (typeof localStorage !== "undefined") {
			sidebarCollapsed =
				localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
		}

		const result = await ZUI.authCheck();
		if (!result.ok) {
			goto("/");
		}
	});
	import ToastContainer from "$lib/components/ToastContainer.svelte";
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Literata:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<ToastContainer />

<div
	class="app-layout"
	class:with-sidebar={!isLoginPage}
	class:sidebar-collapsed={sidebarCollapsed}
>
	{#if !isLoginPage}
		<Sidebar
			bind:collapsed={sidebarCollapsed}
			bind:mobileOpen={sidebarMobileOpen}
			onToggle={handleSidebarToggle}
		/>
	{/if}

	<div class="main-content">
		{#if !isLoginPage}
			<header class="top-bar">
				<div class="top-left">
					<button
						class="mobile-menu-btn"
						onclick={toggleMobileSidebar}
						aria-label="Toggle navigation"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="3" y1="6" x2="21" y2="6"></line>
							<line x1="3" y1="12" x2="21" y2="12"></line>
							<line x1="3" y1="18" x2="21" y2="18"></line>
						</svg>
					</button>
				</div>
				<div class="zlib-login">
					{#if zlibName}
						<div class="user-info">
							<span class="user-badge">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
									<circle cx="12" cy="7" r="4"></circle>
								</svg>
								{zlibName}
							</span>
							<button
								class="logout-btn"
								onclick={handleLogout}
								title="Logout from Z-Library"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
									<polyline points="16 17 21 12 16 7"></polyline>
									<line x1="21" y1="12" x2="9" y2="12"></line>
								</svg>
							</button>
						</div>
					{:else}
						<button
							class="zlib-connect-btn"
							onclick={openModal}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
								<polyline points="10 17 15 12 10 7"></polyline>
								<line x1="15" y1="12" x2="3" y2="12"></line>
							</svg>
							Connect Z-Library
						</button>
					{/if}
				</div>
			</header>
		{/if}

		<main class="content">
			{@render children()}
		</main>
	</div>
</div>

{#if sidebarMobileOpen && !isLoginPage}
	<div
		class="mobile-sidebar-backdrop"
		role="button"
		tabindex="0"
		aria-label="Close navigation menu"
		onclick={() => (sidebarMobileOpen = false)}
		onkeydown={(e) => (e.key === "Enter" || e.key === " ") && (sidebarMobileOpen = false)}
	></div>
{/if}

{#if showModal}
	<div
		class="modal-backdrop"
		role="button"
		tabindex="0"
		onclick={closeModal}
		onkeydown={(e) => handleKeyDown(e, closeModal)}
	>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={handleModalClick}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="modal-header">
				<div class="modal-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
						<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
					</svg>
				</div>
				<h2>Connect Z-Library</h2>
				<p class="modal-subtitle">Link your Z-Library account to search and download books</p>
			</div>

			{#if error}
				<div class="error">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					<p>{error.message}</p>
				</div>
			{/if}

			<div class="form-group">
				<label for="zlib-username">
					{loginWithToken ? "User ID" : "Email"}
				</label>
				<input 
					id="zlib-username"
					type="text" 
					bind:value={username}
					placeholder={loginWithToken ? "Enter your User ID" : "Enter your email"}
				/>
			</div>

			<div class="form-group">
				<label for="zlib-password">
					{loginWithToken ? "User Key" : "Password"}
				</label>
				<input 
					id="zlib-password"
					type="password" 
					bind:value={password}
					placeholder={loginWithToken ? "Enter your User Key" : "Enter your password"}
				/>
			</div>

			<label class="checkbox-label">
				<input type="checkbox" bind:checked={loginWithToken} />
				<span class="checkbox-custom"></span>
				<span class="checkbox-text">Use token authentication</span>
			</label>

			<div class="actions">
				<button class="btn-secondary" onclick={closeModal}>Cancel</button>
				<button class="btn-primary" onclick={handleLogin} disabled={isLoading}>
					{#if isLoading}
						<span class="spinner"></span>
						Connecting...
					{:else}
						Connect
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:root {
		--font-ui: "Inter", sans-serif;
		--font-reading: "Literata", serif;
		--sidebar-width: 240px;
		--sidebar-collapsed-width: 60px;
		--color-bg-primary: rgb(15, 20, 25);
		--color-bg-secondary: rgb(22, 30, 40);
		--color-bg-elevated: rgb(28, 38, 50);
		--color-border: rgba(255, 255, 255, 0.08);
		--color-accent: #1e90ff;
		--color-accent-hover: #3ba0ff;
		--color-text-primary: #fff;
		--color-text-secondary: rgba(255, 255, 255, 0.7);
		--color-text-muted: rgba(255, 255, 255, 0.5);
	}

	:global(body) {
		font-family: var(--font-ui);
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		margin: 0;
		padding: 0;
	}

	:global(html),
	:global(body) {
		overflow-x: hidden;
	}

	:global(h1, h2, h3) {
		font-family: var(--font-reading);
	}

	.app-layout {
		min-height: 100vh;
	}

	.app-layout.with-sidebar .main-content {
		margin-left: var(--sidebar-width);
		transition: margin-left 0.2s ease;
	}

	.app-layout.with-sidebar.sidebar-collapsed .main-content {
		margin-left: var(--sidebar-collapsed-width);
	}

	.main-content {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.top-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.5rem;
		background: rgba(22, 30, 40, 0.8);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.top-left {
		display: flex;
		align-items: center;
	}

	.mobile-menu-btn {
		display: none;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--color-border);
		border-radius: 0.6rem;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.mobile-menu-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.zlib-login {
		display: flex;
		align-items: center;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		background: rgba(30, 144, 255, 0.1);
		border: 1px solid rgba(30, 144, 255, 0.2);
		border-radius: 2rem;
		color: #1e90ff;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.logout-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.logout-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
		color: #f87171;
	}

	.zlib-connect-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, var(--color-accent), #0066cc);
		border: none;
		border-radius: 0.5rem;
		color: #fff;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.zlib-connect-btn:hover {
		background: linear-gradient(135deg, var(--color-accent-hover), #0077ee);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px -4px rgba(30, 144, 255, 0.4);
	}

	.content {
		flex: 1;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
		width: 100%;
		box-sizing: border-box;
	}

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		animation: fadeIn 0.2s ease-out;
	}

	.mobile-sidebar-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(2px);
		z-index: 150;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal {
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 
			0 25px 50px -12px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.05) inset;
		width: 360px;
		max-width: calc(100vw - 2rem);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		text-align: center;
	}

	.modal-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background: linear-gradient(135deg, rgba(30, 144, 255, 0.2), rgba(99, 102, 241, 0.2));
		border-radius: 1rem;
		color: var(--color-accent);
		margin-bottom: 1rem;
	}

	.modal h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.35rem;
		font-weight: 600;
	}

	.modal-subtitle {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.modal input[type="text"],
	.modal input[type="password"] {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
		background: rgba(15, 23, 32, 0.6);
		color: #fff;
		font-size: 0.95rem;
		transition: all 0.2s ease;
	}

	.modal input[type="text"]:focus,
	.modal input[type="password"]:focus {
		outline: none;
		border-color: var(--color-accent);
		background: rgba(15, 23, 32, 0.8);
		box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.15);
	}

	.modal input::placeholder {
		color: var(--color-text-muted);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--color-text-secondary);
	}

	.checkbox-label input[type="checkbox"] {
		display: none;
	}

	.checkbox-custom {
		width: 18px;
		height: 18px;
		border: 2px solid var(--color-border);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
		background: var(--color-accent);
		border-color: var(--color-accent);
	}

	.checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
		content: "✓";
		color: white;
		font-size: 12px;
		font-weight: 600;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.btn-primary,
	.btn-secondary {
		flex: 1;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--color-accent), #0066cc);
		border: none;
		color: #fff;
	}

	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, var(--color-accent-hover), #0077ee);
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		color: #fca5a5;
		font-size: 0.85rem;
	}

	.error svg {
		flex-shrink: 0;
	}

	.error p {
		margin: 0;
	}

	@media (max-width: 900px) {
		.app-layout.with-sidebar .main-content,
		.app-layout.with-sidebar.sidebar-collapsed .main-content {
			margin-left: 0;
		}

		.mobile-menu-btn {
			display: inline-flex;
		}

		.top-bar {
			padding: 0.65rem 0.9rem;
		}

		.content {
			padding: 0 1rem;
		}

		.user-badge {
			max-width: 190px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	@media (max-width: 600px) {
		.top-bar {
			gap: 0.75rem;
		}

		.zlib-connect-btn {
			padding: 0.45rem 0.75rem;
			font-size: 0.8rem;
		}

		.user-info {
			gap: 0.4rem;
		}

		.user-badge {
			padding: 0.4rem 0.65rem;
			font-size: 0.78rem;
			max-width: 155px;
		}

		.modal {
			padding: 1.2rem;
			width: min(96vw, 360px);
		}

		.actions {
			flex-direction: column;
		}
	}
</style>
