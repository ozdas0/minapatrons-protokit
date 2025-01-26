import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import ZkappWorkerClient from "./zkappWorkerClient";

interface WorkerStoreState {
  isReady: boolean;
  isLoading: boolean;
  worker?: ZkappWorkerClient;
  minapatronsCompiled: boolean;
  pricesLoaded: boolean;
  status: string;
  progress: number;
  ZKAPP_ADDRESS: string;

  startWorker: () => Promise<void>;
  fetchPrice: (postId: string) => Promise<string>;

  getMinaBalance: (userAddress: string) => Promise<number>;
  createIdentityCommitment: (
    privateKey: string,
    nullifier: string
  ) => Promise<string>;
  createBuyer: (postId: string, publicKey: string) => Promise<void>;
  createBuyTransaction: (
    postId: string,
    price: string,
    senderPublicKey: string
  ) => Promise<void>;
  createCreateContentTransaction: (
    postId: string,
    price: string,
    privateKey: string,
    nullifier: string
  ) => Promise<void>;
  createWithdrawTransaction: (
    privateKey: string,
    nullifier: string,
    receiver: string
  ) => Promise<void>;
  proveUpdateTransaction: () => Promise<void>;
  getTransactionJSON: () => Promise<string>;
}

async function timeout(seconds: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

export const useWorkerStore = create<
  WorkerStoreState,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    isReady: false,
    isLoading: false,
    worker: undefined,
    minapatronsCompiled: false,
    pricesLoaded: false,
    status: "",
    progress: 0,
    ZKAPP_ADDRESS: "B62qohzs1pWUBmKy2jMh4SvPiu48bsTDVkfXZ19GU19hhe5oTxt33Mc",

    async startWorker() {
      console.time("Worker started");

      if (this.isLoading) {
        return;
      }

      if (this.isReady) {
        return;
      }

      set((state) => {
        state.isLoading = true;
        state.status = "Starting";
      });
      const worker = new ZkappWorkerClient();

      await timeout(5);

      set((state) => {
        state.worker = worker;
        state.progress = 5;
      });

      console.time("Active instance set to devnet");
      await worker.setActiveInstanceToDevnet();
      console.timeEnd("Active instance set to devnet");

      set((state) => {
        state.status = "OffchainState";
        state.progress = 7;
      });

      await worker.fetchAccount(this.ZKAPP_ADDRESS);
      await worker.compileOffchainState();

      set((state) => {
        state.status = "Contract";
        state.progress = 45;
      });
      console.timeEnd("Worker started");

      await worker.loadContract();
      await worker.compileContract();
      await worker.initZkappInstance(this.ZKAPP_ADDRESS);

      set((state) => {
        state.minapatronsCompiled = true;
        state.isReady = true;
        state.status = "Finished";
        state.progress = 100;
      });
      return;
    },

    async fetchPrice(postId: string) {
      if (!this.worker) {
        throw new Error("Worker not ready");
      }

      const json = await this.worker.fetchPrice(postId);
      return json;
    },

    async fetchAccount(userAddress: string) {
      if (!this.worker) {
        throw new Error("Worker not ready");
      }

      return await this.worker.fetchAccount(userAddress);
    },

    async getMinaBalance(userAddress: string) {
      if (!this.worker) {
        throw new Error("Worker not ready");
      }

      const balance = await this.worker.getMinaBalance(userAddress);
      return Number(balance);
    },

    async createIdentityCommitment(privateKey: string, nullifier: string) {
      if (!this.worker) {
        throw new Error("Worker not ready");
      }

      return await this.worker.createIdentityCommitment(privateKey, nullifier);
    },

    async createBuyer(postId: string, publicKey: string) {
      if (!this.worker) {
        throw new Error("Worker not ready");
      }

      return await this.worker.createBuyer(postId, publicKey);
    },

    async createBuyTransaction(
      postId: string,
      price: string,
      senderPublicKey: string
    ) {
      if (!this.worker) {
        throw new Error("Worker not ready");
      }

      return await this.worker.createBuyTransaction(
        postId,
        price,
        senderPublicKey
      );
    },

    async createCreateContentTransaction(
      postId: string,
      price: string,
      privateKey: string,
      nullifier: string
    ) {
      if (!this.worker) {
        throw new Error("Worker not ready");
      }

      return await this.worker.createCreateContentTransaction(
        postId,
        price,
        privateKey,
        nullifier
      );
    },

    async createWithdrawTransaction(
      privateKey: string,
      nullifier: string,
      receiver: string
    ) {
      if (!this.worker) {
        throw new Error("Worker not ready");
      }

      return await this.worker.createWithdrawTransaction(
        privateKey,
        nullifier,
        receiver
      );
    },

    async proveUpdateTransaction() {
      if (!this.worker) {
        throw new Error("Worker not ready");
      }

      return await this.worker.proveUpdateTransaction();
    },

    async getTransactionJSON() {
      if (!this.worker) {
        throw new Error("Worker not ready");
      }

      return await this.worker.getTransactionJSON();
    },
  }))
);
