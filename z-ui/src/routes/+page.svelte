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
        headers: { Authorization: `Basic ${credentials}` },
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

      <button on:click={handleLogin}>Login</button>
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
  }

  .card {
    background: #2e2e40;
    border-radius: 1rem;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
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
  }

  label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #bbb;
  }

  input {
    padding: 0.75rem;
    border: 1px solid #444;
    border-radius: 0.5rem;
    background: #3a3a50;
    color: #fff;
    font-size: 1rem;
    transition: border-color 0.2s, background 0.2s;
  }

  input:focus {
    outline: none;
    border-color: #8b5cf6;
    background: #45455c;
  }

  button {
    padding: 0.8rem;
    background: #8b5cf6;
    border: none;
    border-radius: 0.5rem;
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  }

  button:hover {
    background: #7c3aed;
  }

  button:active {
    transform: scale(0.98);
  }
</style>
