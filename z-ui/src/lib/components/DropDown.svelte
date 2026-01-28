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
	<div class="arrow">▾</div>
</div>

<style>
	.dropdown-wrapper {
		position: relative;
		display: inline-block;
		width: fit-content;
	}

	.dropdown {
		padding: 0.7rem 2.2rem 0.7rem 0.9rem;
		border-radius: 0.5rem;
		background-color: rgb(39, 54, 71);
		color: #fff;
		cursor: pointer;
		font-size: 0.95rem;
		border: none;
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
	}

	.arrow {
		position: absolute;
		right: 0.9rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: #ccc;
		font-size: 0.8rem;
	}

	.dropdown:hover + .arrow,
	.dropdown:focus + .arrow {
		color: #fff;
	}
</style>
