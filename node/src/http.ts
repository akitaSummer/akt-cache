import express, { Express, Request, Response, NextFunction } from "express";
import axios from "axios";
import AsyncLock from "async-lock";
import { ConsistentHashMap } from "./consistenthash/consistenthash";
import { getGroup } from "./aktcache";
import { PeerGetter, PeerPicker } from "./peers";

const defaultBasePath = "/_aktcache/";
const defaultReplicas = 50;

const HTTPLOCK = new AsyncLock();

export class HTTP implements PeerPicker {
  self: string; // 记录自己的ip
  port: number; // 记录自己的ip/端口
  basePath: string; // 节点间通讯地址的前缀
  server: Express;
  peers: ConsistentHashMap;
  httpGetters: Map<string, HttpGetter>;

  constructor(self: string, port: number, callback?: () => void) {
    this.self = self;
    this.port = port;
    this.basePath = defaultBasePath;
    this.server = express();

    const router = express.Router();

    router.get(
      `${this.basePath}*`,
      async (request: Request, response: Response) => {
        console.log(
          `[Server ${this.self + ":" + this.port}] method: ${
            request.method
          }, path: ${request.path}`
        );

        const parts = request.path.replace(this.basePath, "").split("/");

        if (parts.length !== 2) {
          return response.status(400).send({
            message: "path error",
          });
        }

        const groupName = parts[0];
        const key = parts[1];

        try {
          const group = await getGroup(groupName);

          if (group === null) {
            return response.status(404).send({
              message: `no such group: ${groupName}`,
            });
          }

          const value = await group.get(key);

          if (value === null) {
            return response.status(500).send({
              message: `server error`,
            });
          }

          response.setHeader("Content-Type", "application/octet-stream");
          response.status(200).send({
            data: value,
          });
        } catch (e) {
          console.log(e);
          return response.status(500).send({
            message: `server error`,
          });
        }
      }
    );

    this.server.use(express.json());

    this.server.use("/", router);

    this.server.listen(this.port, () => {
      console.log(`server run in ${this.self + ":" + this.port}`);
      callback && callback();
    });
  }

  async set(...peers: string[]) {
    try {
      await HTTPLOCK.acquire(`___HTTP___${this.self}___`, () => {
        this.peers = new ConsistentHashMap(defaultReplicas, null);
        this.peers.Add(...peers);
        this.httpGetters = new Map<string, HttpGetter>();
        peers.forEach((peer) => {
          this.httpGetters.set(peer, new HttpGetter(peer + this.basePath));
        });
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async pickPeer(key: string) {
    try {
      const result: HttpGetter | null = await HTTPLOCK.acquire(
        `___HTTP___${this.self}___`,
        async () => {
          // 获取真实结点
          const peer = this.peers.Get(key);
          if (peer !== "" && peer !== this.self) {
            return this.httpGetters[peer];
          }
          return null;
        }
      );
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}

class HttpGetter implements PeerGetter {
  baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get(group: string, key: string) {
    const url = `${this.baseUrl}${group}/${key}`;
    console.log(`GET: ${url}`);
    const res = await axios({
      url,
      method: "GET",
    });

    if (res.status !== 200) {
      return null;
    }

    return res.data.data;
  }
}
