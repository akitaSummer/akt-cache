import { argv } from "process";
import { HTTP } from "./src/http";
import { newGroup, Getter, Group } from "./src/aktcache";
import express, { Express, Request, Response, NextFunction } from "express";

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
};

const post = argv[3];

(async (post: string) => {
  const akt = await createGroup();
  startAPIServer(post, akt);
})(post);
