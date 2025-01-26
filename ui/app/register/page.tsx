"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import styles from "../../styles/register.module.css";
import { useWorkerStore } from "../workerStore";
import { useWalletStore } from "../walletStore";

export default function RegisterPage() {
  const [privateKey, setPrivateKey] = useState("");
  const [nullifier, setNullifier] = useState("");
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const workerStore = useWorkerStore();
  const walletStore = useWalletStore();

  useEffect(() => {
    (async () => {
      try {
        if (!workerStore.isLoading && !workerStore.isReady) {
          await workerStore.startWorker();
          await walletStore.connect();
        }
      } catch (e) {
        console.error("Failed to start worker or connect wallet:", e);
      }
    })();
  }, [workerStore, walletStore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!walletStore.userPublicKey) {
      setError("Please connect your wallet first");
      return;
    }

    const ic = await workerStore.createIdentityCommitment(
      privateKey,
      nullifier
    );
    if (!ic) {
      setError("Failed to create identity commitment");
      return;
    }

    const identity = ic;
    console.log("Identity commitment:", identity);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API}/register`, {
        privateKey,
        nullifier,
        identity,
      });
      setStatus("Registered successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to register");
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Creator Registration</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Private Key
            <input
              className={styles.input}
              type="text"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Enter your private key"
              required
            />
          </label>

          <label className={styles.label}>
            Nullifier
            <input
              className={styles.input}
              type="text"
              value={nullifier}
              onChange={(e) => setNullifier(e.target.value)}
              placeholder="Enter your nullifier"
              required
            />
          </label>

          <button className={styles.button} type="submit">
            Register
          </button>
        </form>

        {error && <p className={styles.error}>Error: {error}</p>}
        {status && <p className={styles.success}>{status}</p>}
      </div>
    </div>
  );
}
