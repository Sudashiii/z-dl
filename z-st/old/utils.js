export const mimeTypes = {
	// Text & Books
	epub: "application/epub+zip",
	pdf: "application/pdf",
	mobi: "application/x-mobipocket-ebook",
	cbr: "application/x-cbr", // Comic Book RAR
	cbz: "application/x-cbz", // Comic Book ZIP

	// Images
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",

	// Fallback
	default: "application/octet-stream",
};

export const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "PUT, GET, PROPFIND, OPTIONS",
	"Access-Control-Allow-Headers": "Authorization, Depth, Content-Type",
};

export async function is_authorized(authorization_header, username, password) {
	const encoder = new TextEncoder();

	const header = encoder.encode(authorization_header);
	console.log(header);
	
	const expected = encoder.encode(`Basic ${btoa(`${username}:${password}`)}`);
	console.log(expected);

	if (header.byteLength !== expected.byteLength) {
		return false; // Length mismatch
	}

    for (var i = 0 ; i != header.length ; i++)
    {
        if (expected[i] != header[i]) return false;
    }

	return true;
}