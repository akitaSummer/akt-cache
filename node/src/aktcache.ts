import AsyncLock from "async-lock";
import { Cache, newCache } from "./cache";

const AKTCACHENAMEMAP: { [propsName: string]: Group } = {};

const GLOBALLOCK = new AsyncLock();

export interface Getter {
  Get(key: string): any | Promise<any> | null;
}

class Group {
  name: string;
  getter: Getter;
  mainCache: Cache;
  constructor(name: string, getters: Getter, mainCache: Cache) {
    name = `__AKTCACHE__${name}`;
    this.name = name;
    this.getter = getters;
    this.mainCache = mainCache;
    AKTCACHENAMEMAP[name] = this;
  }

  async get(key: string) {
    if (!key) {
      return null;
    }
    try {
      const v = await this.mainCache.get(key);
      if (v !== null) {
        return v;
      }
      return await this.load(key);
    } catch (e) {
      console.log(e.toString());
      return null;
    }
  }

  async load(key: string) {
    try {
      return await this.getLocall(key);
    } catch (e) {
      console.log(e.toString());
      return null;
    }
  }

  async getLocall(key: string) {
    try {
      const value = await this.getter.Get(key);

      if (!value) {
        return null;
      }

      await this.populateCache(key, value);

      return value;
    } catch (e) {
      console.log(e.toString());
      return null;
    }
  }

  private async populateCache(key: string, v: any) {
    try {
      await this.mainCache.add(key, v);
    } catch (e) {
      console.log(e.toString());
      return null;
    }
  }
}

export const newGroup = async (
  name: string,
  getters: Getter,
  cacheBytes: number
) => {
  try {
    const group = await GLOBALLOCK.acquire(
      "___AKTCGROUP___NEW___",
      async () => {
        const mapName = `__AKTCACHE__${name}`;
        if (AKTCACHENAMEMAP[mapName]) {
          throw Error("this name is exist");
        }
        const cache = await newCache(`__GROUP__CREATE__${name}`, cacheBytes);
        if (!cache) {
          throw Error("create cache failed");
        }
        return new Group(name, getters, cache);
      }
    );
    return group;
  } catch (e) {
    console.log(e.toString());
    return null;
  }
};

export const getGroup = async (name: string) => {
  try {
    const group = GLOBALLOCK.acquire("___AKTCGROUP___GET___", () => {
      const mapName = `__AKTCACHE__${name}`;
      return AKTCACHENAMEMAP[mapName] || null;
    });
    return group;
  } catch (e) {
    console.log(e.toString());
    return e;
  }
};
