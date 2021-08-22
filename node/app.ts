import { HTTP } from "./src/http";
import { newGroup, Getter } from "./src/aktcache";

const db = {
  akt: "123",
  akita: "321",
  akitasummer: "213",
};

const getter: Getter = {
  Get(key: string) {
    const v = db[key];
    if (v) {
      return v;
    }

    return null;
  },
};

newGroup("num", getter, 2048);

const port = 9999;

const peers = new HTTP("localhost", port, () => {
  console.log(`aktcache is running at ${port}`);
});
