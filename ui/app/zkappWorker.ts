import "reflect-metadata";
import { fetchAccount, Mina, PublicKey, Field, PrivateKey } from "o1js";
import * as Comlink from "comlink";
import {
  MinaPatron,
  offchainState,
} from "../../contracts/build/src/minapatrons";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

const state = {
  MinaPatronInstance: null as null | typeof MinaPatron,
  offchainStateInstance: null as null | typeof offchainState,
  zkappInstance: null as null | MinaPatron,
  transaction: null as null | Transaction,
};

export const api = {
  async setActiveInstanceToDevnet() {
    const Network = Mina.Network({
      mina: "https://api.minascan.io/node/devnet/v1/graphql",
      archive: "https://api.minascan.io/archive/devnet/v1/graphql",
    });
    console.log("Devnet network instance configured");
    Mina.setActiveInstance(Network);
  },
  async loadContract() {
    const contract = (await import("../../contracts/build/src/minapatrons.js"))[
      "MinaPatron"
    ];

    if (!contract) {
      throw new Error(`Could not load contract Minapatron from the module`);
    }

    state.MinaPatronInstance = contract;
  },

  async compileContract() {
    console.log("Compiling contract in worker");

    await state.MinaPatronInstance!.compile();
    console.log("Contract compiled in worker");
  },

  async compileOffchainState() {
    console.log("Compiling offchain state in worker");
    console.time("Compiling offchain state is done in worker");

    try {
      await offchainState.compile();
      console.log("Offchain state compiled in worker");
    } catch (error) {
      console.error("Offchain state compilation error:", error);
    }
    console.timeEnd("Compiling offchain state is done in worker");
    console.log("Offchain state compiled in worker");
  },

  async initZkappInstance(publicKey58: string) {
    await this.setActiveInstanceToDevnet();
    const { MinaPatron } = await import(
      "../../contracts/build/src/minapatrons"
    );
    console.log("Initializing zkapp instance in worker");
    const publicKey = PublicKey.fromBase58(publicKey58);
    state.zkappInstance = new MinaPatron(publicKey);
    state.zkappInstance.offchainState.setContractInstance(state.zkappInstance);
    console.log("Initialized zkapp instance in worker");
  },

  async fetchAccount(publicKey58: string) {
    console.log("Fetching account in worker");
    const publicKey = PublicKey.fromBase58(publicKey58);
    console.log("Fetched account in worker");
    return fetchAccount({ publicKey });
  },

  async getMinaBalance(userAddress: string) {
    console.log("Getting Mina balance in worker");
    const publicKey = PublicKey.fromBase58(userAddress);
    await fetchAccount({ publicKey });
    const balance = Mina.getBalance(publicKey);
    console.log("Got Mina balance in worker");
    return balance.toString();
  },

  async fetchPrice(postId: string) {
    console.log("Fetching price in worker");
    const post = await state.zkappInstance!.offchainState.fields.posts.get(
      Field(postId)
    );

    console.log("Fetched price in worker");
    const price = post.value.price.toString();
    return price;
  },

  async createIdentityCommitment(privateKey: string, nullifier: string) {
    const { IdentityCommitment } = await import(
      "../../contracts/build/src/minapatrons"
    );
    console.log("Creating identity commitment in worker");
    const identityCommitment = IdentityCommitment.createCommitment(
      PrivateKey.fromBase58(privateKey),
      Field(nullifier)
    );
    console.log("Created identity commitment in worker");
    return identityCommitment.commitment.toString();
  },

  async createBuyer(postId: string, publicKey: string) {
    const { Buyer } = await import("../../contracts/build/src/minapatrons");
    console.log("Creating buyer in worker");
    const buyer = Buyer.createBuyer(
      Field(postId),
      PublicKey.fromBase58(publicKey)
    );
    console.log("Created buyer in worker");
  },

  async createBuyTransaction(
    postId: string,
    price: string,
    senderPublicKey: string
  ) {
    console.log("Creating buy transaction in worker");
    const sender = PublicKey.fromBase58(senderPublicKey);
    state.transaction = await Mina.transaction(
      { sender: sender, fee: price },
      async () => {
        await state.zkappInstance!.buyContent(Field(postId));
      }
    );
    console.log("Created buy transaction in worker");
  },
  async createCreateContentTransaction(
    postId: string,
    price: string,
    privateKey: string,
    nullifier: string
  ) {
    const { IdentityCommitment, Post, UInt64 } = await import(
      "../../contracts/build/src/minapatrons"
    );
    console.log("Creating create content transaction in worker");

    const identityCommitment = IdentityCommitment.createCommitment(
      PrivateKey.fromBase58(privateKey),
      Field(nullifier)
    );

    const money = UInt64.from(price);
    const newPost = Post.createPost(identityCommitment, money);
    const id = Field(postId);

    state.transaction = await Mina.transaction(async () => {
      await state.zkappInstance!.createContent(id, newPost);
    });
    console.log("Created create content transaction in worker");
  },
  async createWithdrawTransaction(
    privateKey: string,
    nullifier: string,
    receiver: string
  ) {
    console.log("Creating withdraw transaction in worker");
    state.transaction = await Mina.transaction(async () => {
      await state.zkappInstance!.withdrawRevenue(
        PrivateKey.fromBase58(privateKey),
        Field(nullifier),
        PublicKey.fromBase58(receiver)
      );
    });
    console.log("Created withdraw transaction in worker");
  },

  async proveUpdateTransaction() {
    console.log("Proving update transaction in worker");
    await state.transaction!.prove();
    console.log("Proved update transaction in worker");
  },
  async getTransactionJSON() {
    console.log("Getting transaction JSON in worker");
    return state.transaction!.toJSON();
  },
};

if (typeof window !== "undefined") {
  Comlink.expose(api);
}
