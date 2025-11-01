import express from "express";
import {
  dumpCache,
  handleDeleteFile,
  handleFileList,
  handleGetFile,
  handleMultpleUploads,
  handlePutFile,
} from "./handlers.js";
import { corsHeaders, is_authorized } from "./utils.js";
import path from "path";
import fs from "fs";

const app = express();
const port = process.env.PORT || 1900;
const AUTH_REALM = "BOOKO-DAV";

// Middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Helper: Send CORS headers ---
app.use((req, res, next) => {
  Object.entries(corsHeaders).forEach(([key, value]) =>
    res.setHeader(key, value)
  );
  next();
});

// --- Basic Auth Middleware ---
app.use(async (req, res, next) => {
  // Skip auth for favicon and root
  if (req.path === "/" || req.path === "/favicon.ico") return next();

  const authorization = req.headers["authorization"] || "";
  const authorized = await is_authorized(
    authorization,
    process.env.USER,
    process.env.PASSWORD
  );

  if (!authorized) {
    res.setHeader("WWW-Authenticate", `Basic realm="${AUTH_REALM}"`);
    return res.status(401).send("Unauthorized");
  }

  next();
});

// --- PUT: Upload Single File ---
app.put("/{*splat}", (req, res) =>
  handlePutFile(req, process.env, null).then((r) => sendResponse(r, res))
);

// --- DELETE: Delete File ---
app.delete("/{*splat}", (req, res) =>
  handleDeleteFile(req, process.env, null).then((r) => sendResponse(r, res))
);

// --- POST /upload: Upload Multiple Files ---
app.post("/upload", (req, res) =>
  handleMultpleUploads(req, process.env, null).then((r) => sendResponse(r, res))
);

// --- GET: Get File ---
app.get("/{*splat}", (req, res, next) => {
  if (req.path === "/" || req.path.startsWith("/dav")) return next();
  handleGetFile(req, process.env, null).then((r) => sendResponse(r, res));
});

// --- PROPFIND: File Listing (WebDAV) ---
app.all("/{*splat}", (req, res, next) => {
  if (req.method === "PROPFIND") {
    handleFileList(req, process.env, null).then((r) => sendResponse(r, res));
  } else {
    next();
  }
});

// --- Fallback for Unsupported Methods ---
app.all("/{*splat}", (req, res) => {
  res.status(405).set(corsHeaders).send("Method not allowed");
});

// --- Helper: Convert Response objects to Express responses ---
function sendResponse(r, res) {
  if (r instanceof Response) {
    r.text().then((body) => {
      res.status(r.status);
      for (const [k, v] of r.headers.entries()) res.setHeader(k, v);
      res.send(body);
    });
  } else {
    res.send(r);
  }
}

app.listen(port, () => {
  console.log(`🚀 BOOKO-DAV running on http://localhost:${port}`);
});
