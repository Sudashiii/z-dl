<script lang="ts">
	interface Props {
		options?: string[];
		selected?: string;
		onchange?: (value: string) => void;
	}

	let {
		options = ['option 1', 'option 2', 'option 3', 'option 4'],
		selected = $bindable(options[0]),
		onchange
	}: Props = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selected = target.value;
		onchange?.(selected);
	}
</script>

<div class="dropdown-wrapper">
	<select bind:value={selected} onchange={handleChange} class="dropdown">
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
		border-radius: 0.5rem;
		background: rgba(15, 23, 32, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #fff;
		cursor: pointer;
		font-size: 0.9rem;
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		transition: all 0.2s ease;
	}

	.dropdown:hover {
		border-color: rgba(255, 255, 255, 0.2);
		background: rgba(15, 23, 32, 0.8);
	}

	.dropdown:focus {
		outline: none;
		border-color: #1e90ff;
		box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.15);
	}

	.dropdown option {
		background: rgb(22, 30, 40);
		color: #fff;
	}

	.arrow {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: rgba(255, 255, 255, 0.4);
		display: flex;
		align-items: center;
		transition: color 0.2s ease;
	}

	.dropdown:hover + .arrow,
	.dropdown:focus + .arrow {
		color: rgba(255, 255, 255, 0.8);
	}
</style>
