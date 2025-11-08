<script lang="ts">
    import { onMount } from "svelte";
    import type { ZBook } from "$lib/types/ZLibrary/ZBook";
    import { goto } from "$app/navigation";
    import type { ZSearchBookRequest } from "$lib/types/ZLibrary/Requests/ZSearchBookRequest";
    import DropDown from "$lib/components/DropDown.svelte";
    import Loading from "$lib/components/Loading.svelte";
    import BookCard from "$lib/components/BookCard.svelte";
    import { downloadBook } from "$lib/client/downloadBook";

    const apiUrl = "/api";

    let authUser = "";
    let authPass = "";
    let title = "";
    let lang = "german";
    let format = "epub";
    let books: ZBook[] = [];
    let isLoading = false;

    async function booksList() {
        isLoading = true;
        if ((!authUser || !authPass) && typeof localStorage !== "undefined") {
            authUser = localStorage.getItem("authUser") || "";
            authPass = localStorage.getItem("authPass") || "";
        }
        const credentials = btoa(`${authUser}:${authPass}`);

        const payload: ZSearchBookRequest = {
            searchText: title,
            languages: [lang],
            extensions: [format],
        };

        const res = await fetch(apiUrl + "/zlibrary/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${credentials}`,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            console.error("Request failed", res.statusText);
            isLoading = false;
            return;
        }
        let booksResponse: ZBook[] = await res.json();
        books = booksResponse;
        isLoading = false;
    }


    onMount(async () => {
        if ((!authUser || !authPass) && typeof localStorage !== "undefined") {
            authUser = localStorage.getItem("authUser") || "";
            authPass = localStorage.getItem("authPass") || "";
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
    <Loading bind:show={isLoading} />

    <div class="search">
        <div class="search-bar">
            <input
                type="text"
                placeholder="Search for Books"
                bind:value={title}
                on:keydown={(e) => e.key === "Enter" && booksList()}
            />
        </div>

        <div class="search-options">
            <DropDown
                bind:selected={lang}
                on:change={() => {}}
                options={["english", "german", "french", "spanish"]}
            />
            <DropDown
                bind:selected={format}
                on:change={() => {}}
                options={["epub", "mobi", "pdf"]}
            />
        </div>
        <div></div>
    </div>
    <div></div>

    <div class="book-list">
        {#if books.length > 0}
            {#each books as book}
 	            <BookCard {book} downloadBook={downloadBook} shareBook={downloadBook}/>
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

    input {
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

    .book-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
</style>
