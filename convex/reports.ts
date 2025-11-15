import { query } from "./_generated/server";
import { v } from "convex/values";

// Health summary metrics per user. For now returns deterministic data
// derived from clerkId so charts are stable without historical records.
export const getSummary = query({
  args: { clerkId: v.string() },
  handler: async (_ctx, { clerkId }) => {
    const seed = [...clerkId].reduce((a, c) => a + c.charCodeAt(0), 0);
    const mod = (n: number) => (seed % n) / n;
    return {
      overallProgress: Math.round(70 + mod(30) * 30),
      moodStability: Math.round(75 + mod(27) * 25),
      sleepQuality: Math.round(72 + mod(19) * 20),
      stressLevel: ["Low", "Moderate"][seed % 2],
    };
  },
});

export const getTrends = query({
  args: { clerkId: v.string() },
  handler: async (_ctx, { clerkId }) => {
    const base = [...clerkId].reduce((a, c) => a + c.charCodeAt(0), 0) % 50;
    const weekly = Array.from({ length: 7 }, (_, i) => ({
      day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
      mood: 5 + Math.sin((i + base) * 0.6) * 1.5 + (i/14),
      anxiety: 3 + Math.cos((i + base) * 0.55) * 1.2 - (i/20),
    }));

    const sleep = Array.from({ length: 4 }, (_, w) => ({
      week: `Week ${w + 1}`,
      hours: 5 + ((base + w) % 4),
      quality: 60 + ((base * (w + 1)) % 30),
    }));

    const distribution = [
      { name: "Exercise", value: 25 },
      { name: "Mindfulness", value: 30 },
      { name: "Social", value: 20 },
      { name: "Sleep", value: 25 },
    ];

    const monthly = Array.from({ length: 4 }, (_, i) => ({
      month: ["Jan","Feb","Mar","Apr"][i],
      overall: 70 + i * 5,
      mood: 68 + i * 5,
      sleep: 72 + i * 4,
      stress: 40 - i * 5,
    }));

    return { weekly, sleep, distribution, monthly };
  },
});
