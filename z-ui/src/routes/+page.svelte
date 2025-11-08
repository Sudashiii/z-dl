<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";

	let username = "";
	let password = "";
	let isValid = false;
	const apiUrl = "/api";

	async function checkAuth() {
		if (!username || !password) return;

		const credentials = btoa(`${username}:${password}`);

		try {
			const res = await fetch(`${apiUrl}/auth-check`, {
				headers: { Authorization: `Basic ${credentials}` }
			});

			if (res.status === 200) {
				isValid = true;
				if (typeof localStorage !== "undefined") {
					localStorage.setItem("authUser", username);
					localStorage.setItem("authPass", password);
				}
				goto("/books");
			} else {
				isValid = false;
				clearStoredAuth();
			}
		} catch {
			isValid = false;
			clearStoredAuth();
		}
	}

	async function handleLogin() {
		await checkAuth();
	}

	function clearStoredAuth() {
		if (typeof localStorage !== "undefined") {
			localStorage.removeItem("authUser");
			localStorage.removeItem("authPass");
		}
	}

	onMount(() => {
		if (typeof localStorage !== "undefined") {
			username = localStorage.getItem("authUser") || "";
			password = localStorage.getItem("authPass") || "";
			if (username && password) {
				checkAuth();
			}
		}
	});
</script>

<main class="login">
	{#if !isValid}
		<div class="card">
			<h1>Login</h1>

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

			<button onclick={handleLogin}>Login</button>
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
		transition: background 0.2s, box-shadow 0.2s;
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
		transition: background 0.2s, transform 0.1s;
	}

	button:hover {
		background: rgb(80, 105, 130);
	}

	button:active {
		transform: scale(0.98);
	}
</style>
