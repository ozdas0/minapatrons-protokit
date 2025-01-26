"use client";
import "../styles/globals.css";
import Link from "next/link";
import { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useWalletStore } from "./walletStore";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const walletStore = useWalletStore();

  const HIDE_THRESHOLD = 20;
  useEffect(() => {
    (async () => {
      try {
        await walletStore.connect();
      } catch (e) {
        console.error("Failed to connect wallet:", e);
      }
    })();
  }, [walletStore]);
  const user = walletStore.userPublicKey;

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = Math.max(window.scrollY, 0);

      if (currentScrollY > HIDE_THRESHOLD && currentScrollY > lastScrollY) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY) {
        setHidden(false);
      }
      setLastScrollY(currentScrollY);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <html lang="en">
      <body>
        <header className={`site-header ${hidden ? "hidden" : ""}`}>
          <div className="brand">MINAPATRONS</div>
          <nav className="site-nav">
            <Link href="/addpage" className="navButton">
              Posting
            </Link>
            <Link href={`/user/${user}`} className="navButton">
              My Contents
            </Link>
            <Link href="/register" className="navButton">
              Register
            </Link>
            <Link href="/" className="navButton">
              Home
            </Link>
          </nav>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
