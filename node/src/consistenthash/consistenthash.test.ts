import test from "ava";
import { ConsistentHashMap } from "./consistenthash";

test("test hash", async (t) => {
  const hash = new ConsistentHashMap(3, (key: any) => key.toString());

  hash.Add("6", "4", "2");

  const testCases = {
    "2": "2",
    "11": "2",
    "23": "4",
    "27": "2",
  };

  const keys = Object.keys(testCases);
  for (let i = 0; i < keys.length; i++) {
    t.is(hash.Get(keys[i]), testCases[keys[i]]);
  }

  hash.Add("8");

  testCases["27"] = "8";

  for (let i = 0; i < keys.length; i++) {
    t.is(hash.Get(keys[i]), testCases[keys[i]]);
  }

  t.pass();
});
