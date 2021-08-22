import test from "ava";
import axios from "axios";
import { join } from "path";
import { spawn } from "child_process";

test.before(async (t) => {
  const app = await spawn("node", [join(__dirname, "./app.js")]);
  await new Promise((resolve) => {
    app.stdout.on("data", (m) => {
      console.log(m.toString()); // app is running in http://localhost:9999/
      resolve("");
    });
  });
});

test("test server running", async (t) => {
  const res = await axios({
    url: "http://localhost:9999/_aktcache/num/akt",
    method: "GET",
  });
  t.is(res.status, 200);
  t.deepEqual(res.data, {
    data: "123",
  });
  t.pass();
});

test("test server error", async (t) => {
  try {
    const res = await axios({
      url: "http://localhost:9999/_aktcache/num/a",
      method: "GET",
    });
    t.fail();
  } catch (e) {
    t.is(e.response.status, 500);
    t.deepEqual(e.response.data, {
      message: `server error`,
    });
    t.pass();
  }
});
