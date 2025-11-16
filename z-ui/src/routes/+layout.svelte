<script lang="ts">
    import { goto } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
    import { authCheck } from '$lib/client/routes/authCheck';
	import { ZUI } from '$lib/client/zui';
    import type { ZLoginRequest } from '$lib/types/ZLibrary/Requests/ZLoginRequest';
    import type { ZTokenLoginRequest } from '$lib/types/ZLibrary/Requests/ZTokenLoginRequest';
    import { onMount } from 'svelte';

	let { children } = $props();

	let showModal = $state(false);
	let username = $state('');
	let password = $state('');
	let authUser = '';
    let authPass = '';
    let zlibName = $state('');
	let loginWithToken = $state(false);

	function openModal() {
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

    async function login() {
		if(loginWithToken){

			const payload: ZTokenLoginRequest = { 
				userId: username, 
				userKey: password, 
			};
			
			await ZUI.tokenLogin(payload);
		} else {
			const payload: ZLoginRequest = { 
				email: username, 
				password: password, 
			};
			const res = await ZUI.passwordLogin(payload);
			localStorage.setItem("zlibName", res.user.name);
		}	

        closeModal();
    }

	function handleKey(e: KeyboardEvent, fn: () => void) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			fn();
		}
	}

	onMount(async () => {
        if ((!authUser || !authPass) && typeof localStorage !== "undefined") {
            authUser = localStorage.getItem("authUser") || "";
            authPass = localStorage.getItem("authPass") || "";
            zlibName = localStorage.getItem("zlibName") || "";
        }

        try {
            await authCheck();

        } catch {
            goto("/");
        }
    });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com">

	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Literata:wght@400;500;600&display=swap"
		rel="stylesheet"
	>

</svelte:head>

<div>
	<div
		class="zlib-login"
		role="button"
		tabindex="0"
	>

	{#if zlibName != ''}
		<span>Welcome {zlibName}</span>
		<span> | </span>
		<span 
			role="button" 
			aria-label="logout"
			tabindex="0"
			onclick={openModal}>
			Logout
		</span>
	{:else}
		<span
			role="button"
			tabindex="0"
			onclick={openModal}
			onkeydown={(e) => handleKey(e, openModal)}
			aria-label="login"
		>
			Log in with ZLib
		</span>
	{/if}
	</div>

	{@render children()}
</div>

{#if showModal}
	<div class="modal-backdrop" role="button" tabindex="0" onclick={closeModal} onkeydown={(e) => handleKey(e, closeModal)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2>Log in</h2>
			<label>
				User
				<input type="text" bind:value={username} />
			</label>
			<label>
				Password
				<input type="password" bind:value={password} />
			</label>
			<label>
				Token login
				<input type="checkbox" bind:checked={loginWithToken} style="align-self: flex-start;"/>
			</label>
			<div class="actions">
				<button onclick={login}>Login</button>
				<button class="cancel" onclick={closeModal}>Cancel</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:root {
		--font-ui: 'Inter', sans-serif;
		--font-reading: 'Literata', serif;
	}

	:global(body) {
  		font-family: var(--font-ui);
		background: rgb(19, 26, 33);
		color: #fff;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	:global(h1, h2, h3) {
		font-family: var(--font-reading);
	}

	.zlib-login {
		position: fixed;
		top: 0.5rem;
		right: 1rem;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		font-size: 0.8rem;
		z-index: 1000;
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

	button:hover {
		background: #0077ff;
	}

	.cancel {
		background: transparent;
		border: 1px solid #555;
	}

	.cancel:hover {
		background: #333;
	}
</style>
