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
		width: fit-content;
	}

	.dropdown {
		padding: 0.6rem 2.5rem 0.6rem 1rem;
		border-radius: 0.65rem;
		background: rgba(9, 22, 37, 0.78);
		border: 1px solid rgba(160, 194, 226, 0.22);
		color: var(--color-text-primary);
		cursor: pointer;
		font-size: 0.9rem;
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		transition: all 0.2s ease;
	}

	.dropdown:hover {
		border-color: rgba(178, 213, 245, 0.35);
		background: rgba(11, 26, 42, 0.9);
	}

	.dropdown:focus {
		outline: none;
		border-color: rgba(120, 196, 255, 0.72);
		box-shadow: 0 0 0 3px rgba(61, 162, 255, 0.2);
	}

	.dropdown option {
		background: rgb(14, 32, 50);
		color: #f5faff;
	}

	.arrow {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		transition: color 0.2s ease;
	}

	.dropdown:hover + .arrow,
	.dropdown:focus + .arrow {
		color: rgba(228, 239, 255, 0.84);
	}
</style>
