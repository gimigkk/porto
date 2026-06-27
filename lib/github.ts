export type GithubGraphDay = {
  date: string;
  level: number;
  count: number;
  text: string;
};

export async function getGithubGraph(): Promise<GithubGraphDay[][]> {
  let weeks: GithubGraphDay[][] = [];
  try {
    const res = await fetch("https://github.com/users/gimigkk/contributions", {
      next: { revalidate: 3600 },
    });
    const html = await res.text();
    
    let tds: Record<string, any> = {};
    for (const match of html.matchAll(/<td([^>]+)><\/td>/g)) {
        const idMatch = match[1].match(/id="([^"]+)"/);
        const dateMatch = match[1].match(/data-date="([^"]+)"/);
        const levelMatch = match[1].match(/data-level="([^"]+)"/);
        if (idMatch && dateMatch && levelMatch) {
            tds[idMatch[1]] = { date: dateMatch[1], level: parseInt(levelMatch[1], 10), count: 0, text: "" };
        }
    }
    
    const ttRegex = /<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]+)<\/tool-tip>/g;
    for (const match of html.matchAll(ttRegex)) {
        if (tds[match[1]]) {
            const text = match[2];
            tds[match[1]].text = text;
            if (text.startsWith("No ")) {
                tds[match[1]].count = 0;
            } else {
                const countMatch = text.match(/^(\d+)/);
                if (countMatch) tds[match[1]].count = parseInt(countMatch[1], 10);
            }
        }
    }
    
    const days = Object.values(tds);
    days.sort((a, b) => a.date.localeCompare(b.date));
    
    const daysToKeep = 34 * 7;
    const recent = days.slice(-daysToKeep);
    
    for (let i = 0; i < recent.length; i += 7) {
       const week = recent.slice(i, i + 7).map(d => ({ date: d.date, level: d.level, count: d.count, text: d.text }));
       while (week.length < 7) week.push({ date: "", level: 0, count: 0, text: "No contributions" });
       weeks.push(week);
    }
    
    if (weeks.length === 0) throw new Error("No data");
  } catch (err) {
    weeks = Array.from({length: 26}, () => Array(7).fill({ level: 0, text: "No contributions" }));
  }
  return weeks;
}
