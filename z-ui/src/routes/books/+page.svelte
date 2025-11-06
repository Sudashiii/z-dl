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

  

        const res = await fetch(apiUrl + '/zlibrary/download' + `?bookId=${book.id}&hash=${book.hash}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
		        'Authorization': `Basic ${credentials}`,
            }
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

    async function login() {
        if ((!authUser || !authPass) && typeof localStorage !== 'undefined') {
            authUser = localStorage.getItem('authUser') || '';
            authPass = localStorage.getItem('authPass') || '';
        }
        const credentials = btoa(`${authUser}:${authPass}`);
        
        const payload: ZLoginRequest = { 
            userId: zUser, 
            userKey: zPass, 
         };


        const res = await fetch(apiUrl + '/zlibrary/login', {
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
    <div class="search-bar">
        <input type="text" placeholder="Title" bind:value={title} />
        <input type="text" placeholder="Lang" bind:value={lang} />
        <input type="text" placeholder="Format" bind:value={format} />

        <label class="checkbox">
            <input type="checkbox" bind:checked={titlefix} /> Titlefix
        </label>

        <button on:click={booksList}>Search</button>

        <input type="text" placeholder="zUser" bind:value={zUser} />
        <input type="text" placeholder="zPass" bind:value={zPass} />
        <button on:click={login}>Login</button>

    </div>

    <div class="book-list">
        {#if books.length > 0}
            {#each books as book}
                <div class="book-card">
                    <img src={book.cover} alt={book.title} />
                    <div class="details">
                        <h3>{book.title}</h3>
                        <p><strong>Author:</strong> {book.author}</p>
                        <p><strong>Publisher:</strong> {book.publisher}</p>
                        <p><strong>Type:</strong> {book.extension}</p>
                        <p><strong>Year:</strong> {book.year}</p>
                        <p><strong>Language:</strong> {book.language}</p>
                        <p><strong>Size:</strong> {book.filesizeString}</p>
                        <p><strong>Book Score/Quality:</strong> {book.interestScore}/{book.qualityScore}</p>
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
        background: #1e1e2f;
        min-height: 100vh;
        font-family: system-ui, sans-serif;
    }

    .search-bar {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 2rem;
    }

    input, button {
        padding: 0.6rem 0.8rem;
        border-radius: 0.5rem;
        border: 1px solid #444;
        background: #2e2e40;
        color: #fff;
        font-size: 0.95rem;
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
        align-items: center;
        background: #2e2e40;
        border-radius: 0.75rem;
        padding: 1rem;
        gap: 1rem;
    }

    .book-card img {
        width: 80px;
        height: 120px;
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