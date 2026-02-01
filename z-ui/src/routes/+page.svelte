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

<main class="login">
	<div class="login-background">
		<div class="gradient-orb orb-1"></div>
		<div class="gradient-orb orb-2"></div>
	</div>

	{#if !isAuthenticated}
		<div class="card">
			<div class="card-header">
				<div class="logo">
					<span class="logo-icon">📚</span>
					<span class="logo-text">Z-DL</span>
				</div>
				<p class="subtitle">Your personal digital library</p>
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
				<label for="username">Username</label>
				<div class="input-wrapper">
					<svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
						<circle cx="12" cy="7" r="4"></circle>
					</svg>
					<input
						id="username"
						type="text"
						bind:value={username}
						placeholder="Enter username"
						onkeydown={handleKeyDown}
					/>
				</div>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<div class="input-wrapper">
					<svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
					</svg>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="Enter password"
						onkeydown={handleKeyDown}
					/>
				</div>
			</div>

			<button class="login-btn" onclick={handleLogin} disabled={isLoading}>
				{#if isLoading}
					<span class="spinner"></span>
					Signing in...
				{:else}
					Sign In
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="5" y1="12" x2="19" y2="12"></line>
						<polyline points="12 5 19 12 12 19"></polyline>
					</svg>
				{/if}
			</button>
		</div>
	{:else}
		<div class="card">
			<div class="success-state">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
					<polyline points="22 4 12 14.01 9 11.01"></polyline>
				</svg>
				<h2>Authenticated</h2>
				<p>Redirecting...</p>
			</div>
		</div>
	{/if}
</main>

<style>
	.login {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 1.5rem;
		background: linear-gradient(135deg, rgb(15, 20, 25) 0%, rgb(22, 30, 40) 50%, rgb(18, 25, 32) 100%);
		color: #fff;
		font-family: var(--font-ui);
		position: relative;
		overflow: hidden;
	}

	.login-background {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.gradient-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.4;
	}

	.orb-1 {
		width: 400px;
		height: 400px;
		background: linear-gradient(135deg, #1e90ff, #6366f1);
		top: -100px;
		right: -100px;
		animation: float 8s ease-in-out infinite;
	}

	.orb-2 {
		width: 300px;
		height: 300px;
		background: linear-gradient(135deg, #8b5cf6, #06b6d4);
		bottom: -50px;
		left: -50px;
		animation: float 10s ease-in-out infinite reverse;
	}

	@keyframes float {
		0%, 100% { transform: translate(0, 0); }
		50% { transform: translate(30px, -30px); }
	}

	.card {
		background: rgba(28, 38, 50, 0.85);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1.25rem;
		box-shadow: 
			0 25px 50px -12px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.05) inset;
		padding: 2.5rem;
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		position: relative;
		z-index: 1;
		animation: slideUp 0.4s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.card-header {
		text-align: center;
		margin-bottom: 0.5rem;
	}

	.logo {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.logo-icon {
		font-size: 2rem;
	}

	.logo-text {
		font-size: 1.75rem;
		font-weight: 700;
		background: linear-gradient(135deg, #fff, #94a3b8);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.subtitle {
		margin: 0;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.9rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-size: 0.85rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
	}

	.input-wrapper {
		position: relative;
	}

	.input-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: rgba(255, 255, 255, 0.4);
		pointer-events: none;
		transition: color 0.2s;
	}

	.input-wrapper:focus-within .input-icon {
		color: #1e90ff;
	}

	input {
		width: 100%;
		padding: 0.875rem 1rem 0.875rem 2.75rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(15, 23, 32, 0.6);
		color: #fff;
		font-size: 0.95rem;
		transition: all 0.2s ease;
		box-sizing: border-box;
	}

	input::placeholder {
		color: rgba(255, 255, 255, 0.35);
	}

	input:focus {
		outline: none;
		border-color: #1e90ff;
		background: rgba(15, 23, 32, 0.8);
		box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.15);
	}

	.login-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		background: linear-gradient(135deg, #1e90ff, #0066cc);
		border: none;
		border-radius: 0.75rem;
		color: #fff;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: 0.5rem;
	}

	.login-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #3ba0ff, #0077ee);
		transform: translateY(-1px);
		box-shadow: 0 10px 20px -10px rgba(30, 144, 255, 0.5);
	}

	.login-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.login-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		width: 18px;
		height: 18px;
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
		border-radius: 0.75rem;
		padding: 0.875rem 1rem;
		color: #fca5a5;
		font-size: 0.9rem;
		animation: shake 0.4s ease-in-out;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-5px); }
		75% { transform: translateX(5px); }
	}

	.error svg {
		flex-shrink: 0;
	}

	.error p {
		margin: 0;
	}

	.success-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem 0;
		color: #4ade80;
	}

	.success-state h2 {
		margin: 0;
		color: #fff;
	}

	.success-state p {
		margin: 0;
		color: rgba(255, 255, 255, 0.5);
	}
</style>
