import test from "ava";
import { List, ListNode, Entry } from "./list";
import { Cache } from "./lru";
import sizeof from "object-sizeof";

test("test cache get", (t) => {
  const lru = new Cache(0);
  lru.Add("key1", "1234");

  const value1 = lru.Get("key1").value;
  t.is(value1, "1234");

  const value2 = lru.Get("key2");
  t.is(value2, null);

  t.pass();
});

test("test cache Removeoldest", (t) => {
  const [k1, k2, k3] = ["key1", "key2", "k3"];
  const [v1, v2, v3] = ["value1", "value2", "v3"];

  const cap = sizeof(new Entry(k1, v1)) + sizeof(new Entry(k2, v2));
  const lru = new Cache(cap);
  lru.Add(k1, v1);
  lru.Add(k2, v2);
  lru.Add(k3, v3);

  const value1 = lru.Get("key1");
  t.is(value1, null);

  t.pass();
});

test("test cache onEvicted", (t) => {
  const keys: string[] = [];
  const callback = (key: string, value: any) => {
    keys.push(key);
  };

  const [k1, k2, k3] = ["key1", "key2", "k3"];
  const [v1, v2, v3] = ["value1", "value2", "v3"];

  const cap = sizeof(new Entry(k1, v1)) + sizeof(new Entry(k2, v2));
  const lru = new Cache(cap, callback);
  lru.Add(k1, v1);
  lru.Add(k2, v2);
  lru.Add(k3, v3);

  t.deepEqual(keys, ["key1"]);

  t.pass();
});

test("test cache add", (t) => {
  const [k1, k2, k3] = ["key1", "key2", "k3"];
  const [v1, v2, v3] = ["value1", "value2", "v3"];
  const size =
    sizeof(new Entry(k1, v1)) +
    sizeof(new Entry(k2, v2)) +
    sizeof(new Entry(k3, v3));
  const lru = new Cache(0);
  lru.Add(k1, v1);
  lru.Add(k2, v2);
  lru.Add(k3, v3);

  t.deepEqual(lru.nbytes, size);

  t.pass();
});
