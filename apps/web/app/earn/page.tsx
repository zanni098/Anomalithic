import type { Metadata } from "next";
import { Reveal } from "../../components/Reveal";
import { ImpressionFlow, SplitDonut } from "../../components/graphics";

export const metadata: Metadata = { title: "Earn — Anomalithic" };

export default function Earn() {
  return (
    <main>
      <section className="section" style={{ paddingBottom: 36 }}>
        <div className="container grid cols-2" style={{ gap: 48, alignItems: "center" }}>
          <Reveal>
            <div>
              <span className="eyebrow">The killer feature</span>
              <h1 className="h-sub" style={{ marginTop: 14 }}>Get paid while agents think.</h1>
              <p className="lead" style={{ marginTop: 18 }}>
                Advertisers pay a monthly fee to place a small link that appears only while the agent
                is thinking. Watchers earn for those impressions — split 50/50, paid in stablecoin.
                Always toggleable.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <SplitDonut />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>An impression you can&apos;t fake.</h2>
            <p className="lead">
              Impressions are minted by the runtime and signed — never a spoofable client timer. The
              ledger verifies before any money moves.
            </p>
          </div>
          <ImpressionFlow />
        </div>
      </section>

      <div className="container">
        <div className="rule" />
      </div>

      <section className="section">
        <div className="container grid cols-2" style={{ gap: 40 }}>
          <Reveal>
            <div className="card">
              <div className="kicker">For advertisers</div>
              <h3>Reach builders, quietly</h3>
              <p>
                One short line + one link, shown during real reasoning time. Set a monthly budget,
                track verified impressions, pause anytime. No banners, no tracking pixels.
              </p>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="card">
              <div className="kicker">For watchers</div>
              <h3>Earn from your idle thinking-time</h3>
              <p>
                Opt in, keep working, and collect 50% of every verified impression to your wallet —
                USDC on Base. Turn it off whenever you like.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
