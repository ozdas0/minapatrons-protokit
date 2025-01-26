"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import styles from "../../../styles/user.module.css";

interface PurchaseItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  contentPath: string;
}

export default function UserPage() {
  const [purchasedContents, setPurchasedContents] = useState<PurchaseItem[]>(
    []
  );
  const [error, setError] = useState<string>("");

  const { userPk } = useParams() as { userPk: string };
  useEffect(() => {
    async function fetchPurchases() {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_API}/purchases/user/${userPk}`
        );
        setPurchasedContents(res.data);
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchPurchases();
  }, [userPk]);

  if (error) {
    return (
      <div className={styles.container}>
        <h2>Error loading purchases: {error}</h2>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <h1 className={styles.userTitle}>User {userPk} Purchases</h1>

        {purchasedContents.length === 0 ? (
          <p>No purchased content found.</p>
        ) : (
          <ul className={styles.purchasesList}>
            {purchasedContents.map((item) => {
              const fileName = item.contentPath.replace("uploads/", "");
              const fileURL = `http://localhost:4444/contents/${fileName}`;

              return (
                <li key={item.id} className={styles.purchaseItem}>
                  <h2 className={styles.purchaseTitle}>{item.title}</h2>
                  <p className={styles.purchaseDescription}>
                    {item.description}
                  </p>
                  <div className={styles.purchaseMeta}>
                    Category: {item.category} | Price: {item.price}
                  </div>

                  <img
                    className={styles.purchaseImage}
                    src={fileURL}
                    alt="Purchased content"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
