"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/home.module.css";
import { useWalletStore } from "./walletStore";

export default function HomePage() {
  const [creatorIc, setCreatorIc] = useState("");
  const router = useRouter();
  const walletStore = useWalletStore();

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

  function handleRegisterClick() {
    router.push("/register");
  }

  function handleSearch() {
    if (!creatorIc) return;

    router.push(`/creatordisplay/${creatorIc}`);
  }
  return (
    <div className={styles.heroSection}>
      <header className={styles.header}></header>

      <div className={styles.heroOverlay}></div>

      <div className={styles.heroContent}>
        <h1 className={styles.mainTitle}>MinaPatrons</h1>
        <p className={styles.subTitle}>
          Empowering privacy for creators and supporters.
        </p>
        <p className={styles.description}>
          MinaPatrons is a platform for creators to share content with their
          supporters while maintaining privacy.
        </p>
        <div className={styles.goSection}>
          <button
            className={styles.registerButton}
            onClick={handleRegisterClick}
          >
            Register
          </button>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search for creators"
              className={styles.searchInput}
              value={creatorIc}
              onChange={(e) => setCreatorIc(e.target.value)}
            />
            <button className={styles.searchButton} onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>

      <section className={styles.infoSection}>
        <Link href="/addpage" className={styles.cardLink}>
          <div className={styles.card}>
            <h3>Share Your Unique Content</h3>
          </div>
        </Link>

        <Link href={`/user/${user}`} className={styles.cardLink}>
          <div className={styles.card}>
            <h3>Your Purchased Contents</h3>
          </div>
        </Link>
      </section>
    </div>
  );
}
