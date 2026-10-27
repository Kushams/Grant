import { LinkButton } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <>
    <SiteHeader />
    <main id="main" tabIndex={-1} className="flex-1 outline-none">
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-teal-700">404</p>
      <h1 className="mt-2 text-3xl font-semibold">We couldn’t find that page</h1>
      <p className="mt-3 text-ink-600">The page may have moved, or the opportunity or record may not exist (or may not be available to your account).</p>
      <div className="mt-6 flex justify-center gap-3">
        <LinkButton href="/">Home</LinkButton>
        <LinkButton href="/opportunities" variant="outline">Browse opportunities</LinkButton>
      </div>
    </div>
    </main>
    <SiteFooter />
    </>
  );
}
