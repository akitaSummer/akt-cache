import express, { Express, Request, Response, NextFunction } from "express";
import { getGroup } from "./aktcache";

const defaultBasePath = "/_aktcache/";

export class HTTP {
  self: string; // 记录自己的ip
  port: number; // 记录自己的ip/端口
  basePath: string; // 节点间通讯地址的前缀
  server: Express;

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
}
