<script lang="ts">
    import { onMount } from 'svelte';
    import type { ZBook } from '$lib/types/ZLibrary/ZBook';
    import { goto } from "$app/navigation";
    import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
    import type { ZLoginRequest } from '$lib/types/ZLibrary/Requests/ZLoginRequest';

    const apiUrl = "/api"

    let authUser = '';
    let authPass = '';
    let title = '';
    let lang = 'german';
    let format = 'EPUB';
    let titlefix = false;
    let books: ZBook[] = [];

    let zUser = '';
    let zPass = '';

    async function booksList() {
        if ((!authUser || !authPass) && typeof localStorage !== 'undefined') {
            authUser = localStorage.getItem('authUser') || '';
            authPass = localStorage.getItem('authPass') || '';
        }
        const credentials = btoa(`${authUser}:${authPass}`);
        

        const payload: ZSearchBookRequest = { 
            searchText: title, 
            languages: [lang], 
            extensions: [format],
         };


        const res = await fetch(apiUrl + '/zlibrary/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
		        'Authorization': `Basic ${credentials}`,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            console.error('Request failed', res.statusText);
            return;
        }
        let booksResponse: ZBook[] = await res.json();
        books = booksResponse;
    }

    async function downloadBook(book: ZBook) {
        if ((!authUser || !authPass) && typeof localStorage !== 'undefined') {
            authUser = localStorage.getItem('authUser') || '';
            authPass = localStorage.getItem('authPass') || '';
        }
        const credentials = btoa(`${authUser}:${authPass}`);

  

        const res = await fetch(apiUrl + '/zlibrary/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
		        'Authorization': `Basic ${credentials}`,
            },
            body: JSON.stringify({
                bookId: book.id,
                hash: book.hash,
                title: book.title,
                upload: true,
                extension: book.extension
            }),
        });

        if (!res.ok) {
            console.error('Download failed', res.statusText);
            return;
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title}.${book.extension.toLowerCase()}`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    onMount(async () => {
        if ((!authUser || !authPass) && typeof localStorage !== 'undefined') {
            authUser = localStorage.getItem('authUser') || '';
            authPass = localStorage.getItem('authPass') || '';
        }
        const credentials = btoa(`${authUser}:${authPass}`);

        try {
        const res = await fetch(`${apiUrl}/auth-check`, {
            headers: { Authorization: `Basic ${credentials}` },
        });

        if (res.status === 200) {

        } else {
            goto("/");
        }
        } catch {
            goto("/");
        }
    });
</script>

<main class="books">

    <div class="search">

        <div class="search-bar">
            <input type="text" placeholder="Search for Books" bind:value={title} />
        </div>

        <div class="search-options">
            <input type="text" placeholder="Lang" bind:value={lang} />
            <input type="text" placeholder="Format" bind:value={format} />

            <label class="checkbox">
                <input type="checkbox" bind:checked={titlefix} /> Titlefix
            </label>
            <button on:click={booksList}>Search</button>
        </div>
        <div>
        </div>
    </div>
    <div>


    </div>

    <div class="book-list">
        {#if books.length > 0}
            {#each books as book}
                <div class="book-card">
                    <img src={book.cover} alt={book.title} />
                    <div class="details">
                        <div>
                            <h3>{book.title}</h3>
                            <p>by {book.author}</p>
                        </div>
                        <!-- <p><strong>Publisher:</strong> {book.publisher}</p>
                        <p><strong>Type:</strong> </p>
                        <p><strong>Year:</strong> </p>
                        <p><strong>Language:</strong> </p>
                        <p><strong>Size:</strong> </p>
                        <p><strong>Book Score/Quality:</strong> {book.interestScore}/{book.qualityScore}</p> -->
                        <p>{book.language} | {book.year} | {book.filesizeString} | {book.extension} | Interest Score: {book.interestScore} | Quality Score: {book.qualityScore}</p>
                    </div>
                    <button class="download-btn" on:click={() => downloadBook(book)}>⬇️</button>
                </div>
            {/each}
        {:else}
            <p>No books found.</p>
        {/if}
    </div>
</main>

<style>
    .books {
        padding: 2rem;
        color: #fff;
        min-height: 100vh;
        font-family: system-ui, sans-serif;
    }

    .search {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 2rem;
        flex-direction: column;
        gap: 2rem;
    }

    input, button {
        padding: 0.6rem 0.8rem;
        border-radius: 0.5rem;
        border: none;
        background-color: rgb(39, 54, 71);
        color: #fff;
        font-size: 0.95rem;
        width: inherit;
    }

    .search-bar {
        width: 100%;
        height: 120%;
    }

    .search-bar input {
        padding-block: 1rem;
        padding-inline: 1.6rem;
        box-sizing: border-box;
    }

    .search-options {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
    }

    input:focus {
        outline: none;
        border-color: #8b5cf6;
    }

    button {
        background: #8b5cf6;
        border: none;
        cursor: pointer;
        font-weight: 600;
    }

    button:hover {
        background: #7c3aed;
    }

    .checkbox {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        color: #ccc;
    }

    .book-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .book-card {
        display: flex;
        justify-content: space-between;
        background: rgb(28, 38, 50);
        border: 1px solid #324d67;
        border-radius: 0.75rem;
        padding: 1rem;
        gap: 1rem;
    }

    .book-card .details {
        display: flex;
        justify-content: space-between;
        flex-direction: column;
    }

    .book-card img {
        width: calc(80px * 1.5);
        height: calc(120px * 1.5);
        border-radius: 0.3rem;
        object-fit: cover;
    }

    .details {
        flex: 1;
    }

    .details h3 {
        margin: 0 0 0.3rem 0;
        font-size: 1.1rem;
    }

    .details p {
        margin: 0.1rem 0;
        font-size: 0.9rem;
        color: #ccc;
    }

    .download-btn {
        font-size: 1.5rem;
        background: transparent;
        border: none;
        cursor: pointer;
        color: #8b5cf6;
    }

    .download-btn:hover {
        color: #a78bfa;
    }
</style>