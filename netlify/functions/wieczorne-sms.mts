// Zadanie wieczorne na Netlify: codziennie o 17:00 UTC (18:00 zimą, 19:00 latem)
// wywołuje /api/cron, które wysyła przypomnienia i podziękowania SMS,
// synchronizuje Kalendarz Google i usuwa stare dane. Na Vercel to samo robi vercel.json.

export default async () => {
  const site = process.env.SITE_URL || process.env.URL;
  const res = await fetch(`${site}/api/cron`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  console.log(`/api/cron: ${res.status} ${await res.text()}`);
};

export const config = { schedule: "0 17 * * *" };
