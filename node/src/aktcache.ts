import AsyncLock from "async-lock";
import { Cache, newCache } from "./cache";
import { Entry } from "./lru/list";
import { PeerGetter, PeerPicker } from "./peers";
import { SingleFlight } from "./singleflight/singleflight";

const AKTCACHENAMEMAP: { [propsName: string]: Group } = {};

const GLOBALLOCK = new AsyncLock();

export interface Getter {
  Get(key: string): any | Promise<any> | null;
}

export class Group {
  name: string;
  getter: Getter;
  mainCache: Cache;
  peers: PeerPicker;
  loader: SingleFlight;
  constructor(name: string, getters: Getter, mainCache: Cache) {
    name = `__AKTCACHE__${name}`;
    this.name = name;
    this.getter = getters;
    this.mainCache = mainCache;
    this.loader = new SingleFlight(name);
    AKTCACHENAMEMAP[name] = this;
  }

  registerPeers(peers: PeerPicker) {
    if (!!this.peers) {
      throw new Error("egisterPeerPicker called more than once");
    }
    this.peers = peers;
  }

  async get(key: string): Promise<any | null> {
    if (!key) {
      return null;
    }
    try {
      const v = await this.mainCache.get(key);
      if (v !== null) {
        return v.value;
      }
      const loadv = await this.load(key);
      return loadv ? loadv.value : null;
    } catch (e) {
      console.log(e.toString());
      return null;
    }
  }

  async load(key: string): Promise<Entry | null> {
    try {
      return await this.loader.Do(key, async () => {
        if (!this.peers) {
          const peer = await this.peers.pickPeer(key);
          if (peer) {
            const value: Entry | null = await this.getFromPeer(peer, key);
            if (value) {
              return value;
            }
          }
        }
        return await this.getLocall(key);
      });
    } catch (e) {
      console.log(e.toString());
      return null;
    }
  }

  async getFromPeer(peer: PeerGetter, key: string) {
    const value = await peer.get(this.name, key);
    if (!value) {
      return null;
    }
    return new Entry(key, value);
  }

  async getLocall(key: string): Promise<Entry | null> {
    try {
      const value = await this.getter.Get(key);

      if (!value) {
        return null;
      }

      await this.populateCache(key, value);

      return new Entry(key, value);
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
    return null;
  }
};
