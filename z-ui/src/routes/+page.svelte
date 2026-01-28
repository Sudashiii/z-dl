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
	{#if !isAuthenticated}
		<div class="card">
			<h1>Login</h1>

			{#if error}
				<div class="error">
					<p>{error.message}</p>
				</div>
			{/if}

			<label for="username">Username</label>
			<input
				id="username"
				type="text"
				bind:value={username}
				placeholder="Enter username"
			/>

			<label for="password">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				placeholder="Enter password"
			/>

			<button onclick={handleLogin} disabled={isLoading}>
				{isLoading ? "Logging in..." : "Login"}
			</button>
		</div>
	{:else}
		<h2>Authenticated</h2>
	{/if}
</main>

<style>
	.login {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		padding: 1rem;
		background: rgb(19, 26, 33);
		color: #fff;
		font-family: var(--font-ui);
	}

	.card {
		background: rgb(28, 38, 50);
		border: 1px solid #324d67;
		border-radius: 0.75rem;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
		padding: 2rem;
		width: 100%;
		max-width: 360px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h1 {
		margin: 0;
		text-align: center;
		font-size: 1.6rem;
		font-weight: 600;
		color: #fff;
	}

	label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #ccc;
	}

	input {
		padding: 0.6rem 0.8rem;
		border-radius: 0.5rem;
		border: none;
		background-color: rgb(39, 54, 71);
		color: #fff;
		font-size: 0.95rem;
		transition:
			background 0.2s,
			box-shadow 0.2s;
	}

	input::placeholder {
		color: #aaa;
	}

	input:focus {
		outline: none;
		background: rgb(49, 64, 81);
		box-shadow: 0 0 0 2px #546d8a;
	}

	button {
		padding: 0.8rem;
		background: rgb(60, 80, 100);
		border: none;
		border-radius: 0.5rem;
		color: #fff;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition:
			background 0.2s,
			transform 0.1s;
	}

	button:hover:not(:disabled) {
		background: rgb(80, 105, 130);
	}

	button:active:not(:disabled) {
		transform: scale(0.98);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.5);
		border-radius: 0.5rem;
		padding: 0.75rem;
		color: #fca5a5;
		font-size: 0.9rem;
	}

	.error p {
		margin: 0;
	}
</style>
