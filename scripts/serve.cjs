const http = require("node:http");
const { createReadStream, existsSync } = require("node:fs");
const { stat } = require("node:fs/promises");
const path = require("node:path");

const defaultRoot = path.resolve(__dirname, "../out");
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".pdf": "application/pdf", ".png": "image/png", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".ttf": "font/ttf", ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8", ".map": "application/json",
};

function createStaticServer(root = defaultRoot) {
  if (!existsSync(path.join(root, "index.html"))) {
    throw new Error("Missing out/index.html. Run pnpm run build first.");
  }
  return http.createServer(async (request, response) => {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    let file;
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
      file = path.resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end();
        return;
      }
      if (pathname.includes("\0")) throw new Error("Invalid path");
    } catch {
      response.writeHead(400).end();
      return;
    }
    let status = 200;
    try {
      if ((await stat(file)).isDirectory()) {
        if (!new URL(request.url, "http://127.0.0.1").pathname.endsWith("/")) {
          const location = new URL(request.url, "http://127.0.0.1");
          location.pathname += "/";
          response.writeHead(308, { Location: location.pathname + location.search }).end();
          return;
        }
        file = path.join(file, "index.html");
      }
      if (!(await stat(file)).isFile()) throw new Error("Not a file");
    } catch {
      status = 404;
      file = path.join(root, "404.html");
    }
    try {
      const info = await stat(file);
      response.writeHead(status, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Content-Length": info.size,
        "Cache-Control": "no-store",
      });
      if (request.method === "HEAD") response.end();
      else createReadStream(file).on("error", () => response.destroy()).pipe(response);
    } catch {
      response.writeHead(500).end("Build asset unavailable");
    }
  });
}

if (require.main === module) {
  try {
    const server = createStaticServer();
    server.on("error", (error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
    server.listen(4173, "127.0.0.1", () => console.log("Serving export at http://127.0.0.1:4173"));
    for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createStaticServer };
