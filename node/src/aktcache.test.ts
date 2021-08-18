import test from "ava";
import { newGroup, Getter, getGroup } from "./aktcache";

const db = {
  akt: "123",
  akita: "321",
  akitasummer: "213",
};

test("test AktCache get", async (t) => {
  const loadCounts: { [propsName: string]: number } = {};

  const getter: Getter = {
    Get(key: string) {
      const v = db[key];
      if (v) {
        const counts = loadCounts[key];
        if (!counts) {
          loadCounts[key] = 0;
        }
        loadCounts[key] += 1;
        return v;
      }

      return null;
    },
  };

  const akt = await newGroup("num", getter, 2048);

  const keys = Object.keys(db);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const v = await akt.get(key);
    t.is(v, db[key]);
    await akt.get(key);
    t.false(loadCounts[key] > 1);
  }

  const v = await akt.get("test");

  t.is(v, null);

  t.pass();
});

test("test AktCache getGroup", async (t) => {
  const groupName = "num1";

  const getter: Getter = {
    Get(key: string) {
      return null;
    },
  };

  const akt = await newGroup(groupName, getter, 2048);

  const group = await getGroup(groupName);

  t.deepEqual(group, akt);

  const notGroup = await getGroup("1234");

  t.is(notGroup, null);

  t.pass();
});
