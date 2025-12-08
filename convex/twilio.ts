import { mutation } from "./_generated/server";
import { v } from "convex/values";
// Use CommonJS require to access Twilio's jwt helpers without type complaints
// eslint-disable-next-line @typescript-eslint/no-var-requires
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;

export const generateAccessToken = mutation({
  args: {
    identity: v.string(), // Clerk user id
    room: v.string(),
    ttlSeconds: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    if (!accountSid || !apiKey || !apiSecret) {
      throw new Error("Twilio credentials are not configured");
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      ttl: args.ttlSeconds ?? 3600, // default 1 hour
    });

    token.identity = args.identity;
    token.addGrant(new VideoGrant({ room: args.room }));

    return token.toJwt();
  },
});
