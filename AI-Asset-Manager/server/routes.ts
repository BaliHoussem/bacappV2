import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SALT_ROUNDS = 10;

const pendingGoogleAuths = new Map<string, { result: any; expires: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingGoogleAuths) {
    if (val.expires < now) pendingGoogleAuths.delete(key);
  }
}, 60000);

export async function registerRoutes(app: Express): Promise<Server> {

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "missing_fields" });
      }

      const key = email.toLowerCase().trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(key)) {
        return res.status(400).json({ error: "invalid_email" });
      }

      if (password.length > 128) {
        return res.status(400).json({ error: "password_too_long" });
      }

      if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return res.status(400).json({ error: "weak_password" });
      }

      const existing = await pool.query("SELECT id FROM accounts WHERE email = $1", [key]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "exists" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await pool.query(
        "INSERT INTO accounts (email, password, auth_provider) VALUES ($1, $2, 'email') RETURNING id",
        [key, hashedPassword]
      );

      return res.json({ success: true, accountId: result.rows[0].id });
    } catch (e) {
      console.error("Signup error:", e);
      return res.status(500).json({ error: "server_error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "missing_fields" });
      }

      const key = email.toLowerCase().trim();

      const result = await pool.query("SELECT * FROM accounts WHERE email = $1", [key]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "not_found" });
      }

      const account = result.rows[0];

      if (account.auth_provider === 'google' && !account.password) {
        return res.status(400).json({ error: "google_account" });
      }

      const passwordValid = await bcrypt.compare(password, account.password);

      if (!passwordValid) {
        return res.status(401).json({ error: "wrong_password" });
      }

      return res.json({
        success: true,
        onboarded: account.onboarded || false,
        profile: account.profile || null,
        accountId: account.id,
      });
    } catch (e) {
      console.error("Login error:", e);
      return res.status(500).json({ error: "server_error" });
    }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const state = req.query.state as string;
      const code = req.query.code as string;
      if (!code || !state) {
        return res.send('<html><body style="background:#131A2B;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:18px;text-align:center"><div>حدث خطأ. أغلق هذه النافذة وحاول مرة أخرى.</div></body></html>');
      }

      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
      const proto = req.get('x-forwarded-proto') || req.protocol;
      let host = req.get('x-forwarded-host') || req.get('host') || '';
      if (process.env.REPLIT_DEV_DOMAIN) {
        host = process.env.REPLIT_DEV_DOMAIN;
      }
      const redirectUri = `https://${host}/api/auth/google/callback`;

      const tokenRes = await globalThis.fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Google token exchange failed:", errText);
        pendingGoogleAuths.set(state, { result: { error: 'token_exchange_failed' }, expires: Date.now() + 300000 });
        return res.send('<html><body style="background:#131A2B;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:18px;text-align:center"><div>حدث خطأ في التسجيل. أغلق هذه النافذة وحاول مرة أخرى.</div></body></html>');
      }

      const tokenData = await tokenRes.json() as { access_token: string };

      const googleRes = await globalThis.fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!googleRes.ok) {
        pendingGoogleAuths.set(state, { result: { error: 'userinfo_failed' }, expires: Date.now() + 300000 });
        return res.send('<html><body style="background:#131A2B;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:18px;text-align:center"><div>حدث خطأ. أغلق هذه النافذة.</div></body></html>');
      }

      const googleUser = await googleRes.json() as { email?: string; name?: string; picture?: string; email_verified?: boolean };
      if (!googleUser.email || !googleUser.email_verified) {
        pendingGoogleAuths.set(state, { result: { error: 'email_not_verified' }, expires: Date.now() + 300000 });
        return res.send('<html><body style="background:#131A2B;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:18px;text-align:center"><div>البريد غير مؤكد. أغلق هذه النافذة.</div></body></html>');
      }

      const email = googleUser.email;
      const name = googleUser.name || null;
      const picture = googleUser.picture || null;
      const key = email.toLowerCase().trim();

      const existing = await pool.query("SELECT * FROM accounts WHERE email = $1", [key]);

      let authResult: any;
      if (existing.rows.length > 0) {
        const account = existing.rows[0];
        let profile = account.profile || null;
        if (picture && profile && !profile.profilePicture) {
          profile = { ...profile, profilePicture: picture };
          await pool.query("UPDATE accounts SET profile = $1 WHERE id = $2", [JSON.stringify(profile), account.id]);
        }
        authResult = {
          success: true,
          email: key,
          isNew: false,
          onboarded: account.onboarded || false,
          profile,
          accountId: account.id,
          googlePicture: picture,
        };
      } else {
        const result = await pool.query(
          "INSERT INTO accounts (email, auth_provider) VALUES ($1, 'google') RETURNING id",
          [key]
        );
        authResult = {
          success: true,
          email: key,
          isNew: true,
          onboarded: false,
          profile: null,
          accountId: result.rows[0].id,
          googleName: name,
          googlePicture: picture,
        };
      }

      pendingGoogleAuths.set(state, { result: authResult, expires: Date.now() + 300000 });
      return res.send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0D1117;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;overflow:hidden}.card{display:flex;flex-direction:column;align-items:center;gap:24px;padding:48px 32px;max-width:360px;animation:fadeUp .6s ease-out}.glow{position:absolute;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,170,.15),transparent 70%);top:50%;left:50%;transform:translate(-50%,-60%);animation:pulse 2s ease-in-out infinite}.check{width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#00D4AA,#00B894);display:flex;align-items:center;justify-content:center;font-size:42px;color:#0D1117;box-shadow:0 8px 40px rgba(0,212,170,.35);animation:scaleIn .5s cubic-bezier(.175,.885,.32,1.275);position:relative;z-index:1}.title{font-size:24px;font-weight:700;color:#E6EDF3;direction:rtl;animation:fadeUp .6s ease-out .2s both}.highlight{color:#00D4AA}.subtitle{font-size:15px;color:#7D8590;line-height:1.8;direction:rtl;animation:fadeUp .6s ease-out .4s both}@keyframes scaleIn{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes fadeUp{0%{transform:translateY(20px);opacity:0}100%{transform:translateY(0);opacity:1}}@keyframes pulse{0%,100%{opacity:.5;transform:translate(-50%,-60%) scale(1)}50%{opacity:.8;transform:translate(-50%,-60%) scale(1.1)}}</style></head><body><div class="glow"></div><div class="card"><div class="check">&#10003;</div><div class="title">تم <span class="highlight">تسجيل الدخول</span> بنجاح</div><div class="subtitle">يمكنك الآن إغلاق هذه الصفحة<br>والعودة إلى التطبيق</div></div></body></html>`);
    } catch (e) {
      console.error("Google callback error:", e);
      return res.send('<html><body style="background:#131A2B;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:18px;text-align:center"><div>حدث خطأ. أغلق هذه النافذة.</div></body></html>');
    }
  });

  app.get("/api/auth/google/poll", async (req: Request, res: Response) => {
    const state = req.query.state as string;
    if (!state) return res.status(400).json({ error: 'missing_state' });

    const pending = pendingGoogleAuths.get(state);
    if (!pending) return res.json({ status: 'pending' });

    pendingGoogleAuths.delete(state);
    return res.json({ status: 'complete', ...pending.result });
  });

  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ error: "missing_token" });
      }

      const googleRes = await globalThis.fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!googleRes.ok) {
        return res.status(401).json({ error: "invalid_token" });
      }

      const googleUser = await googleRes.json() as { email?: string; name?: string; picture?: string; email_verified?: boolean };

      if (!googleUser.email || !googleUser.email_verified) {
        return res.status(401).json({ error: "email_not_verified" });
      }

      const email = googleUser.email;
      const name = googleUser.name || null;
      const picture = googleUser.picture || null;
      const key = email.toLowerCase().trim();

      const existing = await pool.query("SELECT * FROM accounts WHERE email = $1", [key]);

      if (existing.rows.length > 0) {
        const account = existing.rows[0];
        return res.json({
          success: true,
          email: key,
          isNew: false,
          onboarded: account.onboarded || false,
          profile: account.profile || null,
          accountId: account.id,
        });
      }

      const result = await pool.query(
        "INSERT INTO accounts (email, auth_provider) VALUES ($1, 'google') RETURNING id",
        [key]
      );

      return res.json({
        success: true,
        email: key,
        isNew: true,
        onboarded: false,
        profile: null,
        accountId: result.rows[0].id,
        googleName: name || null,
        googlePicture: picture || null,
      });
    } catch (e) {
      console.error("Google auth error:", e);
      return res.status(500).json({ error: "server_error" });
    }
  });

  app.get("/api/auth/check-username/:username", async (req: Request, res: Response) => {
    try {
      const username = (req.params.username as string).toLowerCase().trim();

      if (username.length < 3 || username.length > 30) {
        return res.json({ available: false });
      }
      if (!/^[a-z0-9_]+$/.test(username)) {
        return res.json({ available: false });
      }
      const result = await pool.query(
        "SELECT id FROM accounts WHERE lower(profile->>'username') = $1 AND onboarded = true",
        [username]
      );
      return res.json({ available: result.rows.length === 0 });
    } catch (e) {
      return res.status(500).json({ error: "server_error" });
    }
  });

  app.post("/api/auth/onboarding", async (req: Request, res: Response) => {
    try {
      const { email, profile } = req.body;
      if (!email || !profile) {
        return res.status(400).json({ error: "missing_fields" });
      }

      const key = email.toLowerCase().trim();

      if (profile.username) {
        const cleanUsername = profile.username.toLowerCase().trim();
        if (cleanUsername.length < 3 || cleanUsername.length > 30 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
          return res.status(400).json({ error: "invalid_username" });
        }
        const existing = await pool.query(
          "SELECT id FROM accounts WHERE lower(profile->>'username') = $1 AND onboarded = true AND email != $2",
          [cleanUsername, key]
        );
        if (existing.rows.length > 0) {
          return res.status(409).json({ error: "username_taken" });
        }
      }

      await pool.query(
        "UPDATE accounts SET profile = $1, onboarded = true WHERE email = $2",
        [JSON.stringify(profile), key]
      );

      return res.json({ success: true });
    } catch (e) {
      console.error("Onboarding error:", e);
      return res.status(500).json({ error: "server_error" });
    }
  });

  app.get("/api/auth/account/:email", async (req: Request, res: Response) => {
    try {
      const key = (req.params.email as string).toLowerCase().trim();
      const result = await pool.query("SELECT profile, onboarded, COALESCE(xp, 0) as xp, COALESCE(gems, 0) as gems FROM accounts WHERE email = $1", [key]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "not_found" });
      }

      const account = result.rows[0];
      return res.json({
        onboarded: account.onboarded || false,
        profile: account.profile || null,
        xp: parseInt(account.xp, 10) || 0,
        gems: parseInt(account.gems, 10) || 0,
      });
    } catch (e) {
      console.error("Account fetch error:", e);
      return res.status(500).json({ error: "server_error" });
    }
  });

  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      const wilaya = req.query.wilaya as string | undefined;
      let query = `
        SELECT email, xp, COALESCE(gems, 0) as gems, profile
        FROM accounts
        WHERE onboarded = true AND COALESCE(gems, 0) > 0
      `;
      const params: any[] = [];

      if (wilaya) {
        params.push(wilaya);
        query += ` AND profile->>'wilaya' = $${params.length}`;
      }

      query += ` ORDER BY gems DESC LIMIT 50`;

      const result = await pool.query(query, params);

      const rankings = result.rows.map((row: any, index: number) => {
        const profile = row.profile || {};
        return {
          rank: index + 1,
          name: profile.fullName || profile.username || 'طالب',
          username: profile.username || '',
          xp: row.xp || 0,
          gems: row.gems || 0,
          wilaya: profile.wilaya || '',
          emailId: Buffer.from(row.email).toString('base64').slice(0, 16),
          profilePicture: profile.profilePicture || null,
        };
      });

      const countResult = await pool.query("SELECT COUNT(*) FROM accounts WHERE onboarded = true");
      const totalUsers = parseInt(countResult.rows[0].count, 10) || 0;

      return res.json({ rankings, totalUsers });
    } catch (e) {
      console.error("Leaderboard error:", e);
      return res.status(500).json({ error: "server_error" });
    }
  });

  app.post("/api/leaderboard/sync", async (req: Request, res: Response) => {
    try {
      const { email, xp, gems } = req.body;
      if (!email || (xp === undefined && gems === undefined)) {
        return res.status(400).json({ error: "missing_fields" });
      }

      const key = email.toLowerCase().trim();
      const xpVal = Math.max(0, parseInt(xp, 10) || 0);
      const gemsVal = Math.max(0, parseInt(gems, 10) || 0);

      if (xpVal > 50000 || gemsVal > 500000) {
        return res.status(400).json({ error: "invalid_values" });
      }

      const existing = await pool.query("SELECT xp, COALESCE(gems, 0) as gems FROM accounts WHERE email = $1", [key]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: "not_found" });
      }

      const currentXp = existing.rows[0].xp || 0;
      const currentGems = existing.rows[0].gems || 0;
      const finalXp = Math.max(xpVal, currentXp);
      const finalGems = Math.max(gemsVal, currentGems);

      await pool.query(
        "UPDATE accounts SET xp = $1, gems = $2 WHERE email = $3",
        [finalXp, finalGems, key]
      );

      return res.json({ success: true });
    } catch (e) {
      console.error("XP sync error:", e);
      return res.status(500).json({ error: "server_error" });
    }
  });

  app.post("/api/notifications/register", async (req: Request, res: Response) => {
    try {
      const { email, token, platform } = req.body;
      if (!email || !token) {
        return res.status(400).json({ error: "missing_fields" });
      }

      const key = email.toLowerCase().trim();

      await pool.query(
        `INSERT INTO push_tokens (email, token, platform)
         VALUES ($1, $2, $3)
         ON CONFLICT (token) DO UPDATE SET email = $1, platform = $3`,
        [key, token, platform || 'unknown']
      );

      return res.json({ success: true });
    } catch (e) {
      console.error("Push token register error:", e);
      return res.status(500).json({ error: "server_error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
