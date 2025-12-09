"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

export const generateAccessToken = action({
  args: {
    identity: v.string(),
    room: v.string(),
    ttlSeconds: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;

    if (!accountSid || !apiKey || !apiSecret) {
      throw new Error(
        `Twilio credentials not configured. accountSid=${!!accountSid}, apiKey=${!!apiKey}, apiSecret=${!!apiSecret}`
      );
    }

    const ttl = args.ttlSeconds ?? 3600;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + ttl;
    const jti = `${apiKey}-${now}`;

    const payload = {
      jti,
      iss: apiKey,
      sub: accountSid,
      iat: now,
      exp,
      grants: {
        identity: args.identity,
        video: { room: args.room },
      },
    };

    const base64url = (str: string): string => {
      return Buffer.from(str)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    };

    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = base64url(JSON.stringify(payload));
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(`${header}.${body}`)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const token = `${header}.${body}.${signature}`;

    console.log("✓ Token generated for:", args.identity, "in room:", args.room);
    
    return token;
  },
});
