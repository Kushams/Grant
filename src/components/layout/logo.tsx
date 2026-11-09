import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import { ORG } from "@/config/organization";

/** The supplied National Empowerment Network logo on a white card (the artwork has a white background). */
export function Logo() {
  return (
    <Link href="/" className="inline-block rounded-xl bg-white p-3 shadow-sm" aria-label={`${ORG.name} — home`}>
      <Image src={logo} alt={ORG.name} width={260} height={90} unoptimized className="h-auto w-56 sm:w-64" priority={false} />
    </Link>
  );
}
