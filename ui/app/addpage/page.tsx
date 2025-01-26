"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { generateUniqueId } from "../../lib/utils";
import styles from "../../styles/addpage.module.css";
import { useWorkerStore } from "../workerStore";
import { useWalletStore } from "../walletStore";

interface ContentItem {
  id: string;
  pk: string;
  nullifier: string;
  ic: string;
  title: string;
  description: string;
  price: string;
  category: string;
  contentPath?: File | null;
}

interface WithdrawInfo {
  privateKey: string;
  nullifier: string;
}

export default function Home() {
  // -----------------------------------
  // STATE FOR ADD NEW CONTENT
  // -----------------------------------
  const [newContent, setNewContent] = useState<ContentItem>({
    id: "",
    pk: "",
    nullifier: "",
    ic: "",
    title: "",
    description: "",
    price: "",
    category: "art",
  });
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // -----------------------------------
  // STATE FOR WITHDRAW MONEY
  // -----------------------------------
  const [withdrawData, setWithdrawData] = useState<WithdrawInfo>({
    privateKey: "",
    nullifier: "",
  });
  const [withdrawStatus, setWithdrawStatus] = useState<string>("");

  const [active, setActive] = useState(false);

  const handleUploadClick = () => setActive(true);
  const handleWithdrawClick = () => setActive(false);

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
  // -----------------------------------
  // HANDLERS FOR ADD NEW CONTENT
  // -----------------------------------
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewContent({
      ...newContent,
      contentPath: event.target.files?.[0] || null,
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newContent.contentPath) {
      setUploadStatus("Please select a file");
      return;
    }

    const id = generateUniqueId();
    console.log("ID:", id);

    await workerStore.createCreateContentTransaction(
      id,
      newContent.price,
      newContent.pk,
      newContent.nullifier
    );

    const ic = await workerStore.createIdentityCommitment(
      newContent.pk,
      newContent.nullifier
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

    const formData = new FormData();
    formData.append("id", id);
    formData.append("pk", newContent.pk);
    formData.append("nullifier", newContent.nullifier);
    formData.append("ic", ic);
    formData.append("title", newContent.title);
    formData.append("description", newContent.description);
    formData.append("price", newContent.price);
    formData.append("category", newContent.category);
    formData.append("contentPath", newContent.contentPath);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/contents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadStatus("File uploaded successfully!");
      setNewContent({
        id: "",
        pk: "",
        nullifier: "",
        ic: "",
        title: "",
        description: "",
        price: "",
        category: "art",
        contentPath: null,
      });
    } catch (error: any) {
      console.error(error);
      setUploadStatus(`Error uploading file: ${error.message}`);
    }
  };

  // -----------------------------------
  // HANDLERS FOR WITHDRAW MONEY
  // -----------------------------------
  const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWithdrawData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawer = walletStore.userPublicKey!.toString();
    const { privateKey, nullifier } = withdrawData;
    try {
      await workerStore.createWithdrawTransaction(
        privateKey,
        nullifier,
        withdrawer
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

      console.log("Withdrawing funds:", withdrawData);
      setWithdrawStatus("Withdrawal request submitted!");

      setWithdrawData({
        privateKey: "",
        nullifier: "",
      });
    } catch (error: any) {
      console.error(error);
      setWithdrawStatus(`Error withdrawing: ${error.message}`);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div
        className={`${styles.container} ${active ? styles.active : ""}`}
        id="container"
      >
        <div className={`${styles.formContainer} ${styles.signUp}`}>
          <form className={styles.form} onSubmit={handleUploadSubmit}>
            <h1 className={styles.sectionTitle}>Add New Content</h1>
            <label className={styles.formLabel}>Title</label>
            <input
              type="text"
              className={styles.formInput}
              value={newContent.title}
              onChange={(e) =>
                setNewContent({ ...newContent, title: e.target.value })
              }
              required
            />

            <label className={styles.formLabel}>Description</label>
            <input
              type="text"
              className={styles.formInput}
              value={newContent.description}
              onChange={(e) =>
                setNewContent({ ...newContent, description: e.target.value })
              }
              required
            />

            <label className={styles.formLabel}>Private Key</label>
            <input
              type="text"
              className={styles.formInput}
              value={newContent.pk}
              onChange={(e) =>
                setNewContent({ ...newContent, pk: e.target.value })
              }
              required
            />

            <label className={styles.formLabel}>Nullifier</label>
            <input
              type="text"
              className={styles.formInput}
              value={newContent.nullifier}
              onChange={(e) =>
                setNewContent({ ...newContent, nullifier: e.target.value })
              }
              required
            />

            <label className={styles.formLabel}>Category</label>
            <select
              className={styles.formInput}
              value={newContent.category}
              onChange={(e) =>
                setNewContent({ ...newContent, category: e.target.value })
              }
              required
            >
              <option value="art">Art</option>
              <option value="music">Music</option>
              <option value="blog">Blog</option>
              <option value="education">Education</option>
            </select>

            <label className={styles.formLabel}>Price</label>
            <input
              type="text"
              className={styles.formInput}
              value={newContent.price}
              onChange={(e) =>
                setNewContent({ ...newContent, price: e.target.value })
              }
              required
            />

            <label className={styles.formLabel}>Upload File</label>
            <input
              type="file"
              className={styles.formInput}
              onChange={handleFileChange}
              required
            />

            <button type="submit" className={styles.formButton}>
              Upload
            </button>
            {uploadStatus && <p>{uploadStatus}</p>}
          </form>
        </div>

        <div className={`${styles.formContainer} ${styles.signIn}`}>
          <form className={styles.form} onSubmit={handleWithdrawSubmit}>
            <h2 className={styles.sectionTitle}>Withdraw Money</h2>
            <label className={styles.formLabel}>Private Key</label>
            <input
              type="text"
              className={styles.formInput}
              name="privateKey"
              value={withdrawData.privateKey}
              onChange={handleWithdrawChange}
              required
            />

            <label className={styles.formLabel}>Nullifier</label>
            <input
              type="text"
              className={styles.formInput}
              name="nullifier"
              value={withdrawData.nullifier}
              onChange={handleWithdrawChange}
              required
            />

            <button type="submit" className={styles.formButton}>
              Withdraw
            </button>
            {withdrawStatus && <p>{withdrawStatus}</p>}
          </form>
        </div>
        <div className={styles.toggleContainer}>
          <div className={styles.toggle}>
            <div className={`${styles.togglePanel} ${styles.toggleLeft}`}>
              <h1>Take It</h1>
              <p>You can withdraw your money from here</p>
              <button
                className={styles.hiddenButton}
                onClick={handleWithdrawClick}
              >
                Upload
              </button>
            </div>
            <div className={`${styles.togglePanel} ${styles.toggleRight}`}>
              <h1>Hello, Friend!</h1>
              <p>Share your content and start earning money</p>
              <button
                className={styles.hiddenButton}
                onClick={handleUploadClick}
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
