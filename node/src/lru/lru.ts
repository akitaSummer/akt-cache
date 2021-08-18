import { List, ListNode, Entry } from "./list";
import sizeof from "object-sizeof";

export class LruCache {
  maxBytes: number; // 最大内存
  nbytes: number; // 已使用的内存
  ll: List; // 双向链表
  cache: { [propsName: string]: ListNode };
  onEvicted: (key: string, value: any) => void | null; // 清除条目时执行的函数

  constructor(maxBytes: number, onEvicted?: (key: string, value: any) => void) {
    this.maxBytes = maxBytes;
    this.ll = new List();
    this.cache = {};
    this.onEvicted = onEvicted || null;
    this.nbytes = 0;
  }

  // 查询
  Get(key: string) {
    const ele = this.cache[key];
    if (ele) {
      // 如果键对应的链表节点存在，则将对应节点移动到队尾，并返回查找到的值。
      this.ll.MoveToFront(ele);
      const kv = ele.value;
      return kv;
    }
    return null;
  }

  // 缓存淘汰
  RemoveOldest() {
    const ele = this.ll.Back();
    if (ele) {
      // 移除队列首结点
      this.ll.Remove(ele);
      const kv = ele.value;
      delete this.cache[kv.key];
      this.nbytes -= sizeof(kv);
      // 调用回调
      if (this.onEvicted !== null) {
        this.onEvicted(kv.key, kv.value);
      }
    }
  }

  // 新增/更新
  Add(key: string, value: any) {
    let ele = this.cache[key];
    if (ele) {
      // 更新
      this.ll.MoveToFront(ele);
      const kv = ele.value;
      this.nbytes += sizeof(value) - sizeof(kv.value);
      kv.value = value;
    } else {
      // 新建
      const entry = new Entry(key, value);
      ele = this.ll.PushFront(entry);
      this.cache[key] = ele;
      this.nbytes += sizeof(entry);
    }

    // 超出最大值则清除最少访问的节点
    while (this.maxBytes !== 0 && this.maxBytes < this.nbytes) {
      this.RemoveOldest();
    }
  }

  // 查询数据数量
  Len() {
    return this.ll.len;
  }
}
