import express from "express";

/**
 * Simple HTTP Basic Auth middleware.
 * Add `AUTH_USER` and `AUTH_PASS` to your environment variables.
 */
export function basicAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Secure Area"');
    return res.status(401).send("Authentication required");
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
  const [username, password] = credentials.split(":");

  const validUser = process.env.USER;
  const validPass = process.env.PASSWORD;

  if (username === validUser && password === validPass) {
    return next();
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="Secure Area"');
  return res.status(401).send("Invalid credentials");
}
