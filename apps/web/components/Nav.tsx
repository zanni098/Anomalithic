"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/product", label: "Product" },
  { href: "/builder", label: "Builder" },
  { href: "/earn", label: "Earn" },
  { href: "/docs", label: "Docs" },
];

const REPO = "https://github.com/zanni098/Anomalithic";

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <Logo />
          Anomalithic
        </Link>
        <div className="nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hide-sm ${pathname === l.href ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          <a href={REPO} target="_blank" rel="noreferrer" className="hide-sm">
            GitHub
          </a>
          <a className="btn btn-primary" href={REPO} target="_blank" rel="noreferrer">
            Get started
          </a>
        </div>
      </div>
    </nav>
  );
}
