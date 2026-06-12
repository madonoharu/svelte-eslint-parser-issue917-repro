<script lang="ts">
  import { writable } from 'svelte/store';

  const data = writable({ tags: ['a', 'b'] });
</script>

{#each $data.tags as tag (tag)}
  <span>{`${tag}`}</span>
{/each}
