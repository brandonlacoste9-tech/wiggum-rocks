import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// Configuration
// ------------------------------------------------------------------
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LICENCE_SECRET =
  process.env.LICENCE_SECRET || "dev-secret-do-not-use-in-prod";
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_PLACEHOLDER"
);

// ------------------------------------------------------------------
// Middleware: License Verification (The Money Gate)
// ------------------------------------------------------------------
function verifyLicence(req, res, next) {
  const token = req.headers["x-ralph-license"];

  // Dev mode bypass
  if (process.env.NODE_ENV === "development" && !token) {
    return next();
  }

  if (!token) {
    return res.status(403).json({
      error: "🔒 PRO FEATURE LOCKED",
      message: "Lisa-Simpson (Smart Analysis) requires a Pro License.",
      code: "LICENSE_REQUIRED",
    });
  }

  try {
    const payload = jwt.verify(token, LICENCE_SECRET);
    req.userLicense = payload;
    next();
  } catch (err) {
    return res.status(403).json({
      error: "🔒 INVALID LICENSE",
      message: "License key is expired or invalid.",
      code: "LICENSE_INVALID",
    });
  }
}

// ------------------------------------------------------------------
// Route: Ollama Proxy (Free Tier)
// ------------------------------------------------------------------
app.post("/api/ollama/:model", async (req, res) => {
  const { model } = req.params;
  try {
    console.log(`[Proxy] Forwarding to Ollama: ${OLLAMA_BASE_URL}`);
    const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, ...req.body }),
    });

    if (!ollamaRes.ok) throw new Error(await ollamaRes.text());
    const data = await ollamaRes.json();
    res.json(data);
  } catch (error) {
    console.error(`[Proxy Error] ${error.message}`);
    res.status(502).json({ error: error.message });
  }
});

// ------------------------------------------------------------------
// Route: Gemini Proxy (Paid Tier)
// ------------------------------------------------------------------
app.post("/api/gemini", verifyLicence, async (req, res) => {
  if (!GEMINI_API_KEY)
    return res.status(500).json({ error: "GEMINI_API_KEY missing" });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    if (!geminiRes.ok) throw new Error(await geminiRes.text());
    const data = await geminiRes.json();
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// ------------------------------------------------------------------
// Route: Stripe Payment & Licensing
// ------------------------------------------------------------------
app.post("/api/checkout", async (req, res) => {
  const { tier } = req.body;

  // Pricing Strategy
  let price = 2900; // $29 default
  let name = "Ralph Wiggum PRO License";

  if (tier === "enterprise") {
    price = 9999; // $99.99
    name = "Mr. Burns ENTERPRISE License";
  }

  // Demo Mode Bypass (If no valid key)
  if (
    !process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY.includes("PLACEHOLDER")
  ) {
    return res.json({
      url: `${req.protocol}://${req.get(
        "host"
      )}/success.html?session_id=mock_session_${tier || "pro"}`,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.protocol}://${req.get(
        "host"
      )}/success.html?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${req.protocol}://${req.get("host")}/pricing`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/checkout/claim", async (req, res) => {
  const { session_id, tier } = req.query;

  // Mock Mode
  if (
    session_id &&
    (session_id.includes("mock_session") ||
      session_id === "{CHECKOUT_SESSION_ID}")
  ) {
    // Always succeed in dev/mock mode
    const mockTier =
      tier || (session_id.includes("enterprise") ? "enterprise" : "pro");
    const mockToken = jwt.sign(
      {
        tier: mockTier,
        client: mockTier === "enterprise" ? "Mr. Burns" : "Dev User",
        issuedAt: new Date().toISOString(),
      },
      LICENCE_SECRET
    );
    return res.json({ license: mockToken });
  }

  try {
    if (
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY.includes("PLACEHOLDER")
    ) {
      return res.status(400).json({ error: "Stripe not configured" });
    }
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Payment not completed" });
    }

    // Generate License
    const payload = {
      tier: "pro", // Logic could be enhanced to check amount_total
      client: session.customer_details?.email || "Valued Customer",
      stripeId: session.id,
      issuedAt: new Date().toISOString(),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year
    };

    const token = jwt.sign(payload, LICENCE_SECRET);
    res.json({ license: token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ------------------------------------------------------------------
// Route: Status & Theming
// ------------------------------------------------------------------
app.get("/api/status", (req, res) => {
  const token = req.headers["x-ralph-license"];
  let theme = "standard-green";
  let tier = "free";

  if (token) {
    try {
      const payload = jwt.verify(token, LICENCE_SECRET);
      tier = payload.tier;
      if (tier === "enterprise") theme = "luxury-gold";
    } catch (e) {}
  }

  res.json({ status: "ok", theme, tier });
});

// ------------------------------------------------------------------
// Serving Static Files & Landing Page
// ------------------------------------------------------------------

// Marketing Page
app.get("/pricing", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "landing.html"));
});

// License Activation Page
app.get("/activate", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "activate.html"));
});

// Main App Assets (Vite Build)
app.use(express.static(path.join(__dirname, "..", "dist")));

// Fallback for SPA routing
app.get("*", (req, res) => {
  if (req.accepts("html")) {
    // Serve the built index.html from dist
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  } else {
    res.status(404).end();
  }
});

const PORT = 4000;
app.listen(PORT, () =>
  console.log(`🚀 Wiggum.Rocks Engine listening on port ${PORT}`)
);
