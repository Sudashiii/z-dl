<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { AuthService } from "$lib/client/services/authService";
	import type { ApiError } from "$lib/types/ApiError";

	let username = $state("");
	let password = $state("");
	let isAuthenticated = $state(false);
	let isLoading = $state(false);
	let error = $state<ApiError | null>(null);

	async function handleLogin() {
		if (!username || !password) {
			return;
		}

		isLoading = true;
		error = null;

		const result = await AuthService.validateCredentials({
			username,
			password,
		});

		if (result.ok) {
			isAuthenticated = true;
			goto("/search");
		} else {
			error = result.error;
		}

		isLoading = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Enter") {
			handleLogin();
		}
	}

	onMount(async () => {
		if (AuthService.hasStoredCredentials()) {
			isLoading = true;
			const result = await AuthService.restoreSession();

			if (result.ok) {
				username = result.value.username;
				password = result.value.password;
				isAuthenticated = true;
				goto("/search");
			}

			isLoading = false;
		}
	});
</script>

<main class="login-shell">
	<div class="glow glow-left"></div>
	<div class="glow glow-right"></div>

	{#if !isAuthenticated}
		<section class="login-wrap">
			<div class="login-panel">
				<div class="brand-row">
					<div class="logo">ZD</div>
					<div class="brand-copy">
						<h1>Welcome back</h1>
						<p>Sign in to your private digital library.</p>
					</div>
				</div>

				{#if error}
					<div class="error-box">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="8" x2="12" y2="12"></line>
							<line x1="12" y1="16" x2="12.01" y2="16"></line>
						</svg>
						<p>{error.message}</p>
					</div>
				{/if}

				<div class="field-group">
					<label for="username">Username</label>
					<input
						id="username"
						type="text"
						bind:value={username}
						placeholder="Enter username"
						onkeydown={handleKeyDown}
					/>
				</div>

				<div class="field-group">
					<label for="password">Password</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="Enter password"
						onkeydown={handleKeyDown}
					/>
				</div>

				<button class="login-btn" onclick={handleLogin} disabled={isLoading}>
					{#if isLoading}
						<span class="spinner"></span>
						Signing in...
					{:else}
						Sign In
					{/if}
				</button>

				<p class="signup-note">
					Don't have an account?
					<button type="button">Create one</button>
				</p>
			</div>

			<div class="visual-panel" aria-hidden="true">
				<div class="visual-overlay"></div>
				<div class="visual-content">
					<h2>Z-DL</h2>
					<p>Search, queue, sync progress, and curate your personal reading library with a focused workflow.</p>
				</div>
			</div>
		</section>
	{:else}
		<div class="redirect-panel">
			<div class="spinner"></div>
			<p>Redirecting...</p>
		</div>
	{/if}
</main>

<style>
	.login-shell {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: var(--color-background);
	}

	.glow {
		display: none;
	}

	.login-wrap {
		display: grid;
		grid-template-columns: minmax(320px, 440px) minmax(280px, 480px);
		width: min(980px, 100%);
		min-height: 560px;
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		overflow: hidden;
		background: var(--color-surface);
	}

	.login-panel {
		padding: 2.15rem;
		display: grid;
		align-content: center;
		gap: 0.95rem;
		background: var(--color-background);
	}

	.brand-row {
		display: flex;
		align-items: center;
		gap: 0.78rem;
		margin-bottom: 0.4rem;
	}

	.logo {
		width: 2.5rem;
		height: 2.5rem;
		display: grid;
		place-items: center;
		border-radius: 0.72rem;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.045em;
		background: rgba(201, 169, 98, 0.14);
		color: var(--color-primary);
		border: 1px solid rgba(201, 169, 98, 0.28);
	}

	.brand-copy h1 {
		margin: 0;
		font-size: 1.56rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.brand-copy p {
		margin: 0.22rem 0 0;
		font-size: 0.87rem;
		color: var(--color-text-muted);
	}

	.field-group {
		display: grid;
		gap: 0.36rem;
	}

	.field-group label {
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.field-group input {
		width: 100%;
		padding: 0.72rem 0.82rem;
		border-radius: 0.62rem;
		border: 1px solid var(--color-border);
		background: #1a1d27;
		color: var(--color-text-primary);
		font-size: 0.9rem;
		font-family: inherit;
	}

	.field-group input:focus {
		outline: none;
		border-color: rgba(201, 169, 98, 0.6);
		box-shadow: 0 0 0 2px rgba(201, 169, 98, 0.18);
	}

	.field-group input::placeholder {
		color: rgba(122, 120, 114, 0.9);
	}

	.login-btn {
		margin-top: 0.35rem;
		width: 100%;
		padding: 0.74rem 0.84rem;
		border-radius: 0.62rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		font-size: 0.86rem;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		cursor: pointer;
	}

	.login-btn:hover:not(:disabled) {
		filter: brightness(1.05);
	}

	.login-btn:disabled {
		opacity: 0.62;
		cursor: not-allowed;
	}

	.visual-panel {
		position: relative;
		display: flex;
		align-items: end;
		padding: 1.9rem;
		background: #161921;
		overflow: hidden;
	}

	.visual-panel::before {
		content: "";
		position: absolute;
		inset: 0;
		background-image: url("https://images.unsplash.com/photo-1708548172199-72f7796d4206?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbGlicmFyeSUyMGJvb2tzaGVsZiUyMG1vb2R5fGVufDF8fHx8MTc3MjI4MjI4OXww&ixlib=rb-4.1.0&q=80&w=1080");
		background-size: cover;
		background-position: center;
		opacity: 0.38;
	}

	.visual-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(160deg, rgba(13, 15, 20, 0.1), rgba(13, 15, 20, 0.72));
	}

	.visual-content {
		position: relative;
		z-index: 1;
		max-width: 34ch;
	}

	.visual-content h2 {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.visual-content p {
		margin: 0.46rem 0 0;
		font-size: 0.85rem;
		line-height: 1.55;
		color: var(--color-text-secondary);
	}

	.error-box {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.56rem 0.64rem;
		border-radius: 0.56rem;
		border: 1px solid rgba(196, 68, 58, 0.45);
		background: rgba(196, 68, 58, 0.16);
		font-size: 0.78rem;
		color: #ffb4ad;
	}

	.error-box p {
		margin: 0;
	}

	.signup-note {
		margin: 0.2rem 0 0;
		text-align: center;
		font-size: 0.74rem;
		color: var(--color-text-muted);
	}

	.signup-note button {
		background: transparent;
		border: 0;
		padding: 0 0 0 0.2rem;
		margin: 0;
		color: var(--color-primary);
		font-size: inherit;
		cursor: pointer;
	}

	.signup-note button:hover {
		text-decoration: underline;
	}

	.redirect-panel {
		display: grid;
		justify-items: center;
		gap: 0.7rem;
		padding: 2rem;
		border-radius: 0.9rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.redirect-panel p {
		margin: 0;
		font-size: 0.86rem;
		color: var(--color-text-secondary);
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 900px) {
		.login-wrap {
			grid-template-columns: minmax(0, 1fr);
			min-height: auto;
		}

		.visual-panel {
			display: none;
		}

		.login-panel {
			padding: 1.3rem;
		}
	}
</style>
