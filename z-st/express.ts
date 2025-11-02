import express from "express";
import type { IDavStorage } from "./IDavStorage.ts";
import { S3Storage } from "./S3Storage.ts";
import { basicAuth } from "./basicAuth.ts";

const app = express();
const port = process.env.PORT || 1900;
// app.use(basicAuth);
app.use(express.raw({ type: "*/*", limit: "100mb" }));

// @ts-ignore
app.put("/{*splat}", async (req, res) => {
    const key = req.url.replace(/^\/+/, "");
    console.log(`Uploading to key: ${key}`);
    //@ts-ignore
    const extension = req.url.split(".").pop().toLowerCase();
    console.log(`Detected extension: ${extension}`);
    //@ts-ignore
    const contentType = mimeTypes[extension] || "application/octet-stream";
    const body = req.body;
    console.log(body);

    const s3: IDavStorage = new S3Storage();
    await s3.put(key, body, contentType);

    res.status(200).json({
        message: "✅ Uploaded successfully",
        key,
        contentType,
        size: body.length,
    });
});

app.get("/{*splat}", async (req, res) => {
    const s3: IDavStorage = new S3Storage();
    const key = req.url.replace(/^\/+/, "");
    const data = await s3.get(key);

    const extension = key.split(".").pop()?.toLowerCase() || "default";
    //@ts-ignore
    const contentType = mimeTypes[extension] || mimeTypes.default;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", data.length.toString());
    res.status(200).send(data);
});

app.delete("/{*splat}", async (req, res) => {
  try {
    const s3: IDavStorage = new S3Storage();

    // Derive key from request URL
    const key = req.url.replace(/^\/+/, "");

    if (!key) {
      return res.status(400).json({ error: "No key specified" });
    }

    // Delete the object
    await s3.delete(key);

    res.status(200).json({
      message: "🗑️ File deleted successfully",
      key,
    });
  } catch (err: any) {
    console.error("DELETE error:", err);
    res.status(500).json({
      error: "Failed to delete file",
      details: err.message,
    });
  }
});

app.propfind("/{*splat}", async (req, res) => {
  try {
    const s3: IDavStorage = new S3Storage();
    const path = req.url === "/" ? "" : req.url.replace(/^\/+/, "");

    // Get all objects under this path
    const objects = await s3.list(path);

    // Build WebDAV XML
    const xmlResponse = `
      <D:multistatus xmlns:D="DAV:">
        <D:response>
          <D:href>${path === "" ? "/" : `/${encodeURIComponent(path)}`}</D:href>
          <D:propstat>
            <D:prop>
              <D:resourcetype><D:collection/></D:resourcetype>
              <D:displayname>${path === "" ? "root" : path.split("/").pop()}</D:displayname>
            </D:prop>
            <D:status>HTTP/1.1 200 OK</D:status>
          </D:propstat>
        </D:response>
        ${objects
          .map(
            (obj: any) => `
              <D:response>
                <D:href>/${encodeURIComponent(obj.key)}</D:href>
                <D:propstat>
                  <D:prop>
                    <D:resourcetype/> <!-- Empty for files -->
                    <D:getcontentlength>${obj.size}</D:getcontentlength>
                    <D:getlastmodified>${obj.lastModified?.toUTCString() ?? ""}</D:getlastmodified>
                    <D:getcontenttype>${
                    //@ts-ignore
                      mimeTypes[obj.key.split(".").pop()?.toLowerCase() || "default"] ??
                      mimeTypes.default
                    }</D:getcontenttype>
                    <D:displayname>${obj.key.split("/").pop()}</D:displayname>
                  </D:prop>
                  <D:status>HTTP/1.1 200 OK</D:status>
                </D:propstat>
              </D:response>
            `
          )
          .join("")}
      </D:multistatus>
    `;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(207).send(xmlResponse);
  } catch (err: any) {
    console.error("PROPFIND error:", err);
    res.status(500).json({ error: "Failed to list directory", details: err.message });
  }
});


app.listen(port, () => {
    console.log(`🚀 BOOKO-DAV running on http://localhost:${port}`);
});

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
