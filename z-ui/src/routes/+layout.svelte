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
	let authMode = $state<"password" | "remix">("password");
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
		authMode = "password";
		error = null;
	}

	async function handleLogin() {
		if (!username || !password) {
			return;
		}

		isLoading = true;
		error = null;

		if (authMode === "remix") {
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
		href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
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

			<div class="auth-tabs" aria-label="Z-Library authentication mode">
				<button
					type="button"
					class="auth-tab"
					class:active={authMode === "password"}
					aria-pressed={authMode === "password"}
					onclick={() => (authMode = "password")}
				>
					Email Login
				</button>
				<button
					type="button"
					class="auth-tab"
					class:active={authMode === "remix"}
					aria-pressed={authMode === "remix"}
					onclick={() => (authMode = "remix")}
				>
					Remix Credentials
				</button>
			</div>

			<div class="form-group">
				<label for="zlib-username">
					{authMode === "remix" ? "Remix UserID" : "Email"}
				</label>
				<input 
					id="zlib-username"
					type="text" 
					bind:value={username}
					placeholder={authMode === "remix" ? "Enter your Remix UserID" : "Enter your email"}
				/>
			</div>

			<div class="form-group">
				<label for="zlib-password">
					{authMode === "remix" ? "Remix UserKey" : "Password"}
				</label>
				<input 
					id="zlib-password"
					type="password" 
					bind:value={password}
					placeholder={authMode === "remix" ? "Enter your Remix UserKey" : "Enter your password"}
				/>
			</div>

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
		--font-ui: "Plus Jakarta Sans", sans-serif;
		--font-reading: "Newsreader", serif;
		--sidebar-width: 248px;
		--sidebar-collapsed-width: 72px;
		--color-bg-primary: #070f1b;
		--color-bg-secondary: #0d1a2b;
		--color-bg-elevated: #102239;
		--color-surface: rgba(15, 30, 49, 0.82);
		--color-surface-soft: rgba(18, 37, 58, 0.7);
		--color-border: rgba(160, 194, 226, 0.18);
		--color-accent: #3da2ff;
		--color-accent-hover: #6cb9ff;
		--color-text-primary: #eff5ff;
		--color-text-secondary: rgba(228, 239, 255, 0.74);
		--color-text-muted: rgba(207, 224, 247, 0.54);
	}

	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
		background: radial-gradient(
				circle at 15% -10%,
				rgba(61, 162, 255, 0.18),
				transparent 42%
			),
			radial-gradient(
				circle at 85% 0%,
				rgba(56, 127, 198, 0.18),
				transparent 38%
			),
			var(--color-bg-primary);
		color: var(--color-text-primary);
	}

	:global(body) {
		font-family: var(--font-ui);
	}

	:global(h1, h2, h3) {
		font-family: var(--font-reading);
		letter-spacing: 0.01em;
	}

	.app-layout {
		min-height: 100vh;
	}

	.app-layout.with-sidebar .main-content {
		margin-left: var(--sidebar-width);
		transition: margin-left 0.22s ease;
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
		padding: 0.75rem 1.25rem;
		background: linear-gradient(
			180deg,
			rgba(10, 22, 38, 0.92) 0%,
			rgba(10, 22, 38, 0.76) 100%
		);
		backdrop-filter: blur(16px);
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
		width: 2.5rem;
		height: 2.5rem;
		background: var(--color-surface-soft);
		border: 1px solid var(--color-border);
		border-radius: 0.85rem;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.mobile-menu-btn:hover {
		background: rgba(23, 47, 72, 0.92);
		color: #fff;
	}

	.zlib-login {
		display: flex;
		align-items: center;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.user-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.42rem 0.85rem;
		background: rgba(61, 162, 255, 0.15);
		border: 1px solid rgba(61, 162, 255, 0.3);
		border-radius: 999px;
		color: #93d0ff;
		font-size: 0.82rem;
		font-weight: 600;
	}

	.logout-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: var(--color-surface-soft);
		border: 1px solid var(--color-border);
		border-radius: 0.65rem;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.logout-btn:hover {
		background: rgba(102, 36, 44, 0.34);
		border-color: rgba(239, 116, 126, 0.4);
		color: #ffb5be;
	}

	.zlib-connect-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #2f8be9 0%, #4ea7ff 100%);
		border: 1px solid rgba(116, 185, 255, 0.45);
		border-radius: 0.7rem;
		color: #ecf6ff;
		font-size: 0.84rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.zlib-connect-btn:hover {
		background: linear-gradient(135deg, #3b96f2 0%, #65b6ff 100%);
		transform: translateY(-1px);
		box-shadow: 0 14px 22px -18px rgba(92, 171, 247, 0.9);
	}

	.content {
		flex: 1;
		max-width: 1240px;
		margin: 0 auto;
		padding: 0 2rem;
		width: 100%;
		box-sizing: border-box;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(1, 6, 14, 0.72);
		backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		animation: fadeIn 0.2s ease-out;
	}

	.mobile-sidebar-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(2, 7, 15, 0.56);
		backdrop-filter: blur(2px);
		z-index: 150;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background: linear-gradient(
			155deg,
			rgba(18, 38, 62, 0.98) 0%,
			rgba(11, 25, 43, 0.96) 100%
		);
		border: 1px solid var(--color-border);
		border-radius: 1.1rem;
		padding: 1.8rem;
		box-shadow:
			0 24px 40px -18px rgba(2, 9, 22, 0.85),
			inset 0 1px 0 rgba(203, 228, 255, 0.08);
		width: 380px;
		max-width: calc(100vw - 1.5rem);
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		animation: slideUp 0.25s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(16px) scale(0.97);
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
		width: 3.4rem;
		height: 3.4rem;
		background: linear-gradient(
			145deg,
			rgba(61, 162, 255, 0.28),
			rgba(31, 111, 186, 0.22)
		);
		border: 1px solid rgba(99, 184, 255, 0.25);
		border-radius: 0.95rem;
		color: var(--color-accent);
		margin-bottom: 0.85rem;
	}

	.modal h2 {
		margin: 0 0 0.35rem;
		font-size: 1.4rem;
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
		gap: 0.45rem;
	}

	.form-group label {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.modal input[type="text"],
	.modal input[type="password"] {
		padding: 0.72rem 0.9rem;
		border-radius: 0.65rem;
		border: 1px solid var(--color-border);
		background: rgba(8, 21, 36, 0.72);
		color: #fff;
		font-size: 0.95rem;
		transition: all 0.2s ease;
	}

	.modal input[type="text"]:focus,
	.modal input[type="password"]:focus {
		outline: none;
		border-color: rgba(107, 189, 255, 0.8);
		box-shadow: 0 0 0 3px rgba(61, 162, 255, 0.2);
	}

	.modal input::placeholder {
		color: var(--color-text-muted);
	}

	.auth-tabs {
		display: flex;
		gap: 0.45rem;
		padding: 0.25rem;
		background: rgba(8, 21, 36, 0.65);
		border: 1px solid var(--color-border);
		border-radius: 0.7rem;
	}

	.auth-tab {
		flex: 1;
		padding: 0.5rem 0.6rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 0.55rem;
		color: var(--color-text-secondary);
		font-size: 0.81rem;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.auth-tab.active {
		background: linear-gradient(135deg, rgba(47, 139, 233, 0.28), rgba(78, 167, 255, 0.24));
		border-color: rgba(116, 185, 255, 0.45);
		color: #ecf6ff;
	}

	.actions {
		display: flex;
		gap: 0.65rem;
		margin-top: 0.35rem;
	}

	.btn-primary,
	.btn-secondary {
		flex: 1;
		padding: 0.72rem 0.95rem;
		border-radius: 0.65rem;
		font-size: 0.92rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.42rem;
	}

	.btn-primary {
		background: linear-gradient(135deg, #2f8be9 0%, #4ea7ff 100%);
		border: 1px solid rgba(116, 185, 255, 0.5);
		color: #ecf6ff;
	}

	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, #3c96f2 0%, #66b8ff 100%);
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: rgba(10, 24, 40, 0.72);
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
	}

	.btn-secondary:hover {
		background: rgba(23, 45, 67, 0.9);
		border-color: rgba(162, 201, 235, 0.33);
		color: #fff;
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
		to {
			transform: rotate(360deg);
		}
	}

	.error {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		background: rgba(121, 38, 48, 0.44);
		border: 1px solid rgba(239, 116, 126, 0.38);
		border-radius: 0.65rem;
		padding: 0.72rem 0.85rem;
		color: #ffb5be;
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
			padding: 0.6rem 0.85rem;
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
			gap: 0.7rem;
		}

		.zlib-connect-btn {
			padding: 0.42rem 0.7rem;
			font-size: 0.78rem;
		}

		.user-info {
			gap: 0.38rem;
		}

		.user-badge {
			padding: 0.35rem 0.6rem;
			font-size: 0.76rem;
			max-width: 150px;
		}

		.modal {
			padding: 1.15rem;
			width: min(96vw, 360px);
		}

		.actions {
			flex-direction: column;
		}
	}
</style>
