import { type Server, createServer as createHttpServer } from "node:http";
import type { AdLedger, RedeemRequest } from "./ledger.js";

/** Minimal HTTP face for the ledger: POST /redeem, GET /health. */
export function createServer(ledger: AdLedger): Server {
  return createHttpServer((req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (req.method === "POST" && req.url === "/redeem") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body) as RedeemRequest;
          const result = ledger.redeem(parsed);
          res.writeHead(result.ok ? 200 : 400, { "content-type": "application/json" });
          res.end(JSON.stringify(result));
        } catch {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, reason: "bad_request" }));
        }
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });
}
