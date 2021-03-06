import { HTTP } from "./src/http";
import { newGroup, Getter, Group } from "./src/aktcache";
import express, { Express, Request, Response, NextFunction } from "express";
import { spawn } from "child_process";

const db = {
  akt: "123",
  akita: "321",
  akitasummer: "213",
};

const createGroup = async () => {
  const getter: Getter = {
    Get(key: string) {
      const v = db[key];
      if (v) {
        return v;
      }

      return null;
    },
  };

  return await newGroup("num", getter, 2048);
};

const startCacheServer = async (addr: string, addrs: string[], akt: Group) => {
  let peers: HTTP;
  try {
    await new Promise((resolve) => {
      peers = new HTTP("localhost", Number(addr), () => {
        console.log(`aktcache is running at ${addr}`);
        resolve(null);
      });
    });
    await peers.set(...addrs);
    akt.registerPeers(peers);
  } catch (err) {
    throw err;
  }
};

const startAPIServer = async (apiAddr: string, akt: Group) => {
  const server = express();
  const router = express.Router();
  router.get("/api", async (request: Request, response: Response) => {
    try {
      const key = request.query.key;
      const value = await akt.get(key.toString());
      if (!value) {
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
  });

  server.use(express.json());

  server.use("/", router);

  server.listen(apiAddr, () => {
    console.log(`server run in ${apiAddr}`);
  });
};

const apiAddr = "9999";

const addrMap = {
  "8001": "http://localhost:8001",
  "8002": "http://localhost:8002",
  "8003": "http://localhost:8003",
};

(async (apiAddr: string, addrMap: { [propsName: string]: string }) => {
  const addrs = Object.keys(addrMap);
  const akt = await createGroup();

  addrs.forEach((addr) => {
    spawn("node", ["-port", addr]);
  });

  startCacheServer(apiAddr, addrs, akt);
})(apiAddr, addrMap);
