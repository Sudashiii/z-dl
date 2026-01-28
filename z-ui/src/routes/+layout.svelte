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
			onToggle={handleSidebarToggle}
		/>
	{/if}

	<div class="main-content">
		<header class="top-bar">
			<div class="spacer"></div>
			<div class="zlib-login">
				{#if zlibName}
					<span>Welcome {zlibName}</span>
					<span> | </span>
					<span
						role="button"
						aria-label="logout"
						tabindex="0"
						onclick={handleLogout}
						onkeydown={(e) => handleKeyDown(e, handleLogout)}
					>
						Logout
					</span>
				{:else}
					<span
						role="button"
						tabindex="0"
						onclick={openModal}
						onkeydown={(e) => handleKeyDown(e, openModal)}
						aria-label="login"
					>
						Log in with ZLib
					</span>
				{/if}
			</div>
		</header>

		<main class="content">
			{@render children()}
		</main>
	</div>
</div>

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
			<h2>Log in to Z-Library</h2>

			{#if error}
				<div class="error">
					<p>{error.message}</p>
				</div>
			{/if}

			<label>
				{loginWithToken ? "User ID" : "Email"}
				<input type="text" bind:value={username} />
			</label>

			<label>
				{loginWithToken ? "User Key" : "Password"}
				<input type="password" bind:value={password} />
			</label>

			<label class="checkbox-label">
				<input type="checkbox" bind:checked={loginWithToken} />
				Token login
			</label>

			<div class="actions">
				<button onclick={handleLogin} disabled={isLoading}>
					{isLoading ? "Logging in..." : "Login"}
				</button>
				<button class="cancel" onclick={closeModal}>Cancel</button>
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
	}

	:global(body) {
		font-family: var(--font-ui);
		background: rgb(19, 26, 33);
		color: #fff;
		margin: 0;
		padding: 0;
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
		padding: 0.5rem 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.spacer {
		flex: 1;
	}

	.zlib-login {
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		font-size: 0.8rem;
	}

	.zlib-login span[role="button"]:hover {
		color: #fff;
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
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.modal {
		background: #222c36;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
		width: 300px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		font-size: 0.9rem;
		gap: 0.3rem;
	}

	.checkbox-label {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}

	.checkbox-label input {
		width: auto;
	}

	input {
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		border: 1px solid #444;
		background: #11181f;
		color: #fff;
	}

	.actions {
		display: flex;
		justify-content: space-between;
	}

	button {
		background: #1e90ff;
		border: none;
		border-radius: 6px;
		color: #fff;
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	button:hover:not(:disabled) {
		background: #0077ff;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.cancel {
		background: transparent;
		border: 1px solid #555;
	}

	.cancel:hover {
		background: #333;
	}

	.error {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.5);
		border-radius: 0.5rem;
		padding: 0.75rem;
		color: #fca5a5;
		font-size: 0.85rem;
	}

	.error p {
		margin: 0;
	}
</style>
