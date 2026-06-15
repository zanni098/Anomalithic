import type { EventBus } from "@anomalithic/core";

/**
 * Phase 0 placeholder ad renderer. It demonstrates the killer-feature hook:
 * a single unobtrusive line shown ONLY while the agent is thinking. There is no
 * ad server, impression redemption, or payout yet — those land in Phase 3. The
 * signed impressions are already minted by core and exposed on the run result.
 */
interface PlaceholderAd {
  intro: string;
  url: string;
}

const PLACEHOLDER_ADS: PlaceholderAd[] = [
  { intro: "Your ad here while agents think", url: "https://anomalithic.dev/ads" },
  { intro: "Watchers earn 50% of ad revenue", url: "https://anomalithic.dev/earn" },
];

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

export interface AdsOptions {
  enabled: boolean;
  /** Write target; defaults to stderr so ads never pollute piped stdout. */
  write?: (text: string) => void;
}

export function attachAds(bus: EventBus, options: AdsOptions): void {
  if (!options.enabled) return;
  const write = options.write ?? ((t: string) => process.stderr.write(t));
  let index = 0;

  bus.on("thinking.start", () => {
    const ad = PLACEHOLDER_ADS[index % PLACEHOLDER_ADS.length];
    index += 1;
    if (ad) write(dim(`💡 ${ad.intro} — ${ad.url}\n`));
  });
}
