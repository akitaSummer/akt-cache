import { crc32 } from "node-crc";

export type Hash = (data: any) => string;

export class ConsistentHashMap {
  hash: Hash;
  replicas: number;
  keys: string[];
  hashMap: Map<string, string>;

  constructor(replicas: number, fn?: Hash) {
    this.replicas = replicas;
    this.hashMap = new Map<string, string>();
    this.keys = [];

    if (!fn) {
      fn = (data: any) => crc32(Buffer.from(data, "utf8")).toString("hex");
    }

    this.hash = fn;
  }

  Add(...keys: string[]) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      for (let j = 0; j < this.replicas; j++) {
        const hash = this.hash(j + key);
        this.keys.push(hash);
        this.hashMap[hash] = key;
      }
    }
    this.keys = this.keys.sort();
  }

  Get(key: string) {
    if (this.keys.length === 0) {
      return null;
    }

    const hash = this.hash(key);

    let idx = this.keys.findIndex((item) => {
      return BigInt(item) >= BigInt(hash);
    });

    if (idx === -1) {
      idx = 0;
    }

    return this.hashMap[
      this.keys[Number(BigInt(idx) % BigInt(this.keys.length))]
    ];
  }
}
