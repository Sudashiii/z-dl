<script lang="ts">
	interface Props {
		options?: string[];
		selected?: string;
		id?: string;
		onchange?: (value: string) => void;
	}

	let {
		options = ['option 1', 'option 2', 'option 3', 'option 4'],
		selected = $bindable(options[0]),
		id,
		onchange
	}: Props = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selected = target.value;
		onchange?.(selected);
	}
</script>

<div class="dropdown-wrapper">
	<select id={id} bind:value={selected} onchange={handleChange} class="dropdown">
		{#each options as option}
			<option value={option.toLowerCase()}>
				{option.charAt(0).toUpperCase() + option.slice(1).toLowerCase()}
			</option>
		{/each}
	</select>
	<div class="arrow">
		<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="6 9 12 15 18 9"></polyline>
		</svg>
	</div>
</div>

<style>
	.dropdown-wrapper {
		position: relative;
		display: inline-block;
	}

	.dropdown {
		padding: 0.5rem 2rem 0.5rem 0.68rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text-secondary);
		font-size: 0.78rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		appearance: none;
	}

	.dropdown:hover {
		color: var(--color-text-primary);
		border-color: rgba(255, 255, 255, 0.16);
	}

	.dropdown:focus {
		outline: none;
		border-color: rgba(201, 169, 98, 0.52);
		box-shadow: 0 0 0 2px rgba(201, 169, 98, 0.16);
	}

	.dropdown option {
		background: #1a1d27;
		color: var(--color-text-primary);
	}

	.arrow {
		position: absolute;
		right: 0.6rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--color-text-muted);
		display: inline-flex;
		align-items: center;
	}

	.dropdown:hover + .arrow,
	.dropdown:focus + .arrow {
		color: var(--color-text-secondary);
	}
</style>
