import Link from "next/link";
import { HERO, NAV_ITEMS, NO_GUARANTEE_STATEMENT, ORG } from "@/config/organization";
import { MainNav } from "@/components/layout/main-nav";
import { PrototypeBanner, getNavAccount } from "@/components/layout/site-header";
import { BG_POSTER, HERO_TONE, OBJECT_POSITION } from "./hero-assets";
import { HeroVideo } from "./hero-video";

/** Cinematic, roughly one-viewport hero. Only this section is viewport-height — the page scrolls normally below it. */
export async function Hero() {
  const account = await getNavAccount();
  return (
    <section aria-labelledby="hero-h" className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#0b1220] text-white">
      {/* Poster layer (also the permanent fallback). The supplied imagery is violet-toned, so it is hue-shifted to a neutral navy-blue. */}
      <div data-hero-poster aria-hidden="true" className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${BG_POSTER})`, backgroundPosition: OBJECT_POSITION, filter: HERO_TONE }} />
      <link rel="preload" as="image" href={BG_POSTER} fetchPriority="high" />
      <HeroVideo />
      {/* Legibility: darken the top (nav) and fade the bottom into the page background. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 bg-[#0b1220]/25" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-b from-[#0b1220]/80 via-[#0b1220]/15 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/70 to-transparent" />

      <div className="relative z-30">
        <PrototypeBanner className="relative z-30" />
        <MainNav variant="overlay" items={NAV_ITEMS} account={account} />
      </div>

      <div className="relative z-20 mt-auto px-6 pb-24 pt-20 sm:px-12 sm:pb-28 lg:px-16">
        <div className="max-w-2xl">
          <p className="hero-in-fade d-1 mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{HERO.eyebrow}</p>
          <h1 id="hero-h" className="hero-in d-1 mb-5 text-balance text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">{HERO.headline}</h1>
          <p className="hero-in d-2 mb-8 max-w-md text-base font-light leading-relaxed text-white/75 sm:text-lg">{HERO.body}</p>
          <div className="hero-in d-3 flex flex-wrap items-center gap-3">
            <Link href="/opportunities" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-base font-medium text-[#0b1220] transition-colors hover:bg-white/90">Explore Opportunities</Link>
            <Link href="/how-it-works" className="liquid-glass inline-flex min-h-12 items-center justify-center rounded-full px-7 text-base font-medium text-white transition-colors hover:bg-white/5">How It Works</Link>
          </div>
          <p className="hero-in d-4 mt-6 max-w-md text-xs text-white/60">{ORG.name} is an independent platform — not a government agency. {NO_GUARANTEE_STATEMENT}</p>
        </div>
      </div>
    </section>
  );
}
