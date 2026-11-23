import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  getCricketMatchDetails,
  getCricketMatches,
  getCricketMatchScorecard,
  getCricketMatchSummary,
  getCricketNews,
  getCricketSystemStatus,
} from "./server/services/cricketHubService";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==========================================
// SPORTMONKS & EXTERNAL CRICKET DATA ROUTES
// ==========================================

// Endpoint: Check cricket match & news provider status
app.get("/api/cricket/status", async (req, res) => {
  try {
    const forceVerify = req.query.verify === "true";
    const status = await getCricketSystemStatus(forceVerify);
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: err?.message || "Failed to inspect provider status.",
    });
  }
});

// Endpoint: Fetch all matches (Live, Upcoming, Recent) across International, Domestic, Franchise
app.get("/api/cricket/matches", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true" || req.query.force === "true";
    const result = await getCricketMatches(forceRefresh);

    if (result.statusCode >= 400 && (!result.matches || result.matches.length === 0)) {
      if (result.statusCode === 429 && result.retryAfterSeconds) {
        res.setHeader("Retry-After", String(result.retryAfterSeconds));
      }
      res.setHeader("X-Cache-Status", "MISS");
      return res.status(result.statusCode).json(result);
    }

    res.setHeader("X-Cache-Status", result.cached ? "HIT" : "MISS");
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
    return res.json(result);
  } catch (err: any) {
    console.error("[CricketAPI] Error in /api/cricket/matches:", err?.message || err);
    return res.status(500).json({
      source: "server_error",
      providers: [],
      cached: false,
      count: 0,
      matches: [],
      statusCode: 500,
      code: "UPSTREAM_ERROR",
      error: "Failed to retrieve cricket matches.",
    });
  }
});

// Endpoint: Fetch single match details (overview + scorecard if available)
app.get("/api/cricket/matches/:id", async (req, res) => {
  try {
    const matchId = req.params.id;
    const forceRefresh = req.query.refresh === "true" || req.query.force === "true";
    const result = await getCricketMatchDetails(matchId, forceRefresh);

    if (result.statusCode >= 400 && !result.match) {
      if (result.statusCode === 429 && result.retryAfterSeconds) {
        res.setHeader("Retry-After", String(result.retryAfterSeconds));
      }
      return res.status(result.statusCode).json(result);
    }

    res.setHeader("X-Cache-Status", result.cached ? "HIT" : "MISS");
    return res.json(result.match || result);
  } catch (err: any) {
    console.error("[CricketAPI] Error in /api/cricket/matches/:id:", err?.message || err);
    return res.status(500).json({
      source: "server_error",
      match: null,
      cached: false,
      statusCode: 500,
      code: "UPSTREAM_ERROR",
      error: "Failed to retrieve match details.",
    });
  }
});

// Endpoint: Dedicated match scorecard endpoint
// Never returns HTTP 200 with an empty skeleton as though it were a complete scorecard.
app.get("/api/cricket/matches/:id/scorecard", async (req, res) => {
  try {
    const matchId = req.params.id;
    const forceRefresh = req.query.refresh === "true" || req.query.force === "true";
    const result = await getCricketMatchScorecard(matchId, forceRefresh);

    if (result.statusCode === 429 && result.retryAfterSeconds) {
      res.setHeader("Retry-After", String(result.retryAfterSeconds));
    }
    res.setHeader("X-Cache-Status", result.cached ? "HIT" : "MISS");

    return res.status(result.statusCode).json(result);
  } catch (err: any) {
    console.error("[CricketAPI] Error in /api/cricket/matches/:id/scorecard:", err?.message || err);
    return res.status(500).json({
      source: "server_error",
      matchId: req.params.id,
      scorecardAvailable: false,
      partial: false,
      ballByBallAvailable: false,
      status: "UNKNOWN",
      cached: false,
      statusCode: 500,
      code: "UPSTREAM_ERROR",
      error: "Failed to retrieve match scorecard.",
      innings: [],
      currentInnings: null,
      commentary: [],
      recentBalls: [],
    });
  }
});

// Handler for external RSS cricket news
const handleNewsRequest = async (req: express.Request, res: express.Response) => {
  try {
    const forceRefresh = req.query.refresh === "true" || req.query.force === "true";
    const result = await getCricketNews(forceRefresh);

    if (result.statusCode >= 400 && (!result.articles || result.articles.length === 0)) {
      res.setHeader("X-Cache-Status", "MISS");
      return res.status(result.statusCode).json(result);
    }

    res.setHeader("X-Cache-Status", result.cached ? "HIT" : "MISS");
    res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    return res.json(result);
  } catch (err: any) {
    console.error("[NewsAPI] Error in news endpoint:", err?.message || err);
    return res.status(500).json({
      source: "server_error",
      providers: [],
      cached: false,
      count: 0,
      articles: [],
      statusCode: 500,
      error: "Failed to retrieve cricket news.",
    });
  }
};

app.get("/api/news", handleNewsRequest);
app.get("/api/cricket/news", handleNewsRequest);

// Endpoint: Factual match summary derived strictly from verified provider data
app.get("/api/cricket/summary/:id", async (req, res) => {
  try {
    const summary = await getCricketMatchSummary(req.params.id);
    return res.status(summary.statusCode || 200).json(summary);
  } catch (err: any) {
    return res.status(500).json({ error: "Could not retrieve match summary." });
  }
});

// Start Express server with Vite middleware in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
        watch: process.env.DISABLE_HMR === "true" ? null : {},
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cucuber Apex Cricket Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
