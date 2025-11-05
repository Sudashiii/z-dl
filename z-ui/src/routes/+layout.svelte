<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: linear-gradient(135deg, #1e1e2f, #2c2c3a);
    color: #fff;
  }
</style>