import AsyncLock from "async-lock";
import { LruCache } from "./lru/lru";

const CACHENAMEMAP: { [propsName: string]: Cache } = {};

const GLOBALLOCK = new AsyncLock();

export class Cache {
  name: string;
  mu: AsyncLock;
  lru: LruCache;
  cacheBytes: number;
  constructor(name: string, cacheBytes: number) {
    name = `__CACHE__${name}`;
    this.name = name;
    this.mu = new AsyncLock();
    this.cacheBytes = cacheBytes;
    CACHENAMEMAP[name] = this;
  }

  async add(key: string, value: any) {
    try {
      await this.mu.acquire(this.name, () => {
        if (!this.lru) {
          this.lru = new LruCache(this.cacheBytes);
        }
        this.lru.Add(key, value);
      });
    } catch (e) {
      console.log(e.toString());
    }
  }

  async get(key: string) {
    try {
      const result = await this.mu.acquire(this.name, () => {
        if (!this.lru) {
          return null;
        }

        return this.lru.Get(key);
      });
      return result;
    } catch (e) {
      console.log(e.toString());
    }
  }
}

export const newCache = async (name: string, cacheBytes: number) => {
  try {
    const cache = await GLOBALLOCK.acquire("___CACHE___NEW___", () => {
      const mapName = `__CACHE__${name}`;
      if (CACHENAMEMAP[mapName]) {
        throw Error("this name is exist");
      }
      return new Cache(name, cacheBytes);
    });
    return cache;
  } catch (e) {
    console.log(e.toString());
    return null;
  }
};
