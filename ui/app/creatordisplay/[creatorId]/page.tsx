"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import styles from "../../../styles/creatordisplay.module.css";
import { useWorkerStore } from "../../workerStore";
import { useWalletStore } from "../../walletStore";

export default function CreatorDisplayPage() {
  const [contents, setContents] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
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

  const { creatorId } = useParams() as { creatorId: string };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_API}/contents/bycreator/${creatorId}`
        );
        setContents(response.data);
      } catch (err: any) {
        setError(err.message || "Error fetching data");
      }
    };
    fetchData();
  }, [creatorId]);

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  const handleBuy = async (contentId: string) => {
    if (!walletStore.userPublicKey) {
      alert("Please connect your wallet");
      return;
    }
    const price = await workerStore.fetchPrice(contentId);
    await workerStore.createBuyTransaction(
      contentId,
      price,
      walletStore.userPublicKey
    );
    await workerStore.proveUpdateTransaction();

    const transactionJSON = await workerStore.getTransactionJSON();

    const { hash } = await window.mina!.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        fee: 0.1,
        memo: "",
      },
    });
    await workerStore.createBuyer(contentId, walletStore.userPublicKey);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API}/purchases`, {
        user_pk: walletStore.userPublicKey,
        content_id: contentId,
      });
      alert("Purchase successful!");
    } catch (error: any) {
      alert("Purchase failed: " + error.message);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <h1 className={styles.creatorTitle}>Creator {creatorId} Contents</h1>

        {contents.map((item) => (
          <div key={item.id} className={styles.contentItem}>
            <h2 className={styles.contentTitle}>{item.title}</h2>
            <p className={styles.contentDescription}>{item.description}</p>
            <p className={styles.contentPrice}>Price: {item.price}</p>
            <button
              className={styles.buyButton}
              onClick={() => handleBuy(item.id)}
            >
              Buy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
