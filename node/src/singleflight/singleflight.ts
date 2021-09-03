import AsyncLock from "async-lock";

class Call {
  wg: AsyncLock;
  val: any;
  name: string;
  constructor(key: string) {
    key = `__CALL__${key}`;
    this.name = key;
    this.wg = new AsyncLock();
  }
}

export class SingleFlight {
  mu: AsyncLock;
  name: string;
  map: Map<string, Call>;
  constructor(name: string) {
    name = `__CALL__${name}`;
    this.name = name;
    this.mu = new AsyncLock();
    this.map = new Map<string, Call>();
  }

  async Do(key: string, fn: () => Promise<any | null>) {
    try {
      // 确保只有唯一一个能修改map
      const call: Call = await this.mu.acquire(this.name, async () => {
        if (this.map.get(key)) {
          return this.map.get(key); // 如果请求正在进行中，则等待
        }
        const call = new Call(key);
        this.map[key] = call; // 表明 key 已经有对应的请求在处理
        return call;
      });

      const result = await call.wg.acquire(call.name, async () => {
        try {
          if (!call.val) {
            // 没有值，调用fn
            const val = await fn();
            call.val = val;
            return val;
          } else {
            return call.val; // 存在值，获取
          }
        } catch (err) {
          throw err;
        }
      });
      this.map.delete(key); // 更新map
      return result;
    } catch (err) {
      throw err;
    }
  }
}
