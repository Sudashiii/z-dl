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
					<span class="logo-icon">ZD</span>
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
		background:
			radial-gradient(circle at 15% -8%, rgba(61, 162, 255, 0.22), transparent 40%),
			radial-gradient(circle at 85% 2%, rgba(56, 127, 198, 0.2), transparent 35%),
			linear-gradient(135deg, #070f1b 0%, #0d1a2b 50%, #091423 100%);
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
		background: linear-gradient(135deg, #2f8be9, #4ea7ff);
		top: -100px;
		right: -100px;
		animation: float 8s ease-in-out infinite;
	}

	.orb-2 {
		width: 300px;
		height: 300px;
		background: linear-gradient(135deg, #1f6fb9, #5dc2ff);
		bottom: -50px;
		left: -50px;
		animation: float 10s ease-in-out infinite reverse;
	}

	@keyframes float {
		0%, 100% { transform: translate(0, 0); }
		50% { transform: translate(30px, -30px); }
	}

	.card {
		background: linear-gradient(160deg, rgba(17, 37, 58, 0.92), rgba(11, 25, 40, 0.9));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(160, 194, 226, 0.22);
		border-radius: 1.25rem;
		box-shadow: 
			0 25px 50px -12px rgba(0, 0, 0, 0.55),
			0 0 0 1px rgba(210, 230, 252, 0.06) inset;
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 0.65rem;
		background: linear-gradient(145deg, rgba(61, 162, 255, 0.4), rgba(29, 109, 184, 0.33));
		border: 1px solid rgba(119, 189, 255, 0.45);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: #def0ff;
	}

	.logo-text {
		font-size: 1.75rem;
		font-weight: 700;
		background: linear-gradient(135deg, #f7fbff, #b7d7f6);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.subtitle {
		margin: 0;
		color: rgba(207, 224, 247, 0.58);
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
		color: rgba(228, 239, 255, 0.74);
	}

	.input-wrapper {
		position: relative;
	}

	.input-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: rgba(207, 224, 247, 0.58);
		pointer-events: none;
		transition: color 0.2s;
	}

	.input-wrapper:focus-within .input-icon {
		color: var(--color-accent);
	}

	input {
		width: 100%;
		padding: 0.875rem 1rem 0.875rem 2.75rem;
		border-radius: 0.72rem;
		border: 1px solid rgba(160, 194, 226, 0.22);
		background: rgba(9, 22, 37, 0.78);
		color: var(--color-text-primary);
		font-size: 0.95rem;
		transition: all 0.2s ease;
		box-sizing: border-box;
	}

	input::placeholder {
		color: var(--color-text-muted);
	}

	input:focus {
		outline: none;
		border-color: rgba(120, 196, 255, 0.72);
		background: rgba(11, 26, 42, 0.9);
		box-shadow: 0 0 0 3px rgba(61, 162, 255, 0.22);
	}

	.login-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		background: linear-gradient(135deg, #2f8be9, #4ea7ff);
		border: 1px solid rgba(124, 193, 255, 0.4);
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
		background: linear-gradient(135deg, #3c96f2, #66b8ff);
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
		background: rgba(121, 38, 48, 0.44);
		border: 1px solid rgba(239, 116, 126, 0.38);
		border-radius: 0.75rem;
		padding: 0.875rem 1rem;
		color: #ffb5be;
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

	@media (max-width: 640px) {
		.login {
			padding: 1rem;
			align-items: flex-start;
			padding-top: 10vh;
		}

		.orb-1 {
			width: 280px;
			height: 280px;
			top: -90px;
			right: -130px;
		}

		.orb-2 {
			width: 220px;
			height: 220px;
			bottom: -70px;
			left: -90px;
		}

		.card {
			padding: 1.4rem;
			border-radius: 1rem;
			gap: 1.1rem;
		}

		.logo-text {
			font-size: 1.5rem;
		}

		.logo-icon {
			font-size: 1.7rem;
		}

		.login-btn {
			padding: 0.85rem;
		}
	}
</style>
