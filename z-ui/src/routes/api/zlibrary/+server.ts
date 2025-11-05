// import { ZLibrary } from '$lib/server/application/ZLibrary';
// import { mimeTypes } from '$lib/server/constants/mimeTypes';
// import type { RequestHandler } from '@sveltejs/kit';
// import { json } from '@sveltejs/kit';

// const zlib = new ZLibrary("https://1lib.sk");

// // -------------------------------
// // GET /api/library/:title
// // -------------------------------
// export const GET: RequestHandler = async () => {

//     try {

//         var t = await zlib.tokenLogin("45501539", "fb86f9943048667830fb2d786646bfef");
//         zlib.search("Harry Potter");

//         return json({ success: t });
//         // return new Response(arrayBuffer, {
//         //     headers: {
//         //         'Content-Type': contentType,
//         //         'Content-Length': data.length.toString()
//         //     }
//         // });
//     } catch (err: any) {
//         console.error(err);
//         return json({ error: 'File not found' }, { status: 404 });
//     }
// };
