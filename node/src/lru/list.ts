export class Entry {
  // 存储的数据类型
  key: string;
  value: any;
  constructor(key: string, value: any) {
    this.key = key;
    this.value = value;
  }
}

export class ListNode {
  before: ListNode | null;
  next: ListNode | null;
  value: Entry;
  constructor(value: Entry, before?: ListNode, next?: ListNode) {
    this.value = value;
    this.before = before || null;
    this.next = next || null;
  }
}

export class List {
  root: null | ListNode;
  len: number;

  constructor() {
    this.root = null;
    this.len = 0;
  }

  private checkNodeExist(el: ListNode): ListNode {
    let node = this.root;
    if (!node) {
      throw Error("this node is not exist");
    }
    while (!!node) {
      if (el !== node) {
        node = node.next;
      } else {
        node = el;
        break;
      }
    }
    if (!node) {
      throw Error("this node is not exist");
    }
    return node;
  }

  MoveToFront(el: ListNode) {
    const node = this.checkNodeExist(el);
    if (node.before) {
      node.before.next = node.next;
      const head = this.root;
      this.root = node;
      this.root.before = null;
      this.root.next = head;
    }
  }

  Back(): ListNode | null {
    let node = this.root;
    if (node === null) {
      return node;
    }
    while (node.next !== null) {
      node = node.next;
    }
    return node;
  }

  Remove(el: ListNode) {
    const node = this.checkNodeExist(el);
    if (node.before) {
      node.before.next = node.next;
      node.next = null;
      this.len -= 1;
    } else {
      this.root = node.next;
      node.next = null;
      this.len -= 1;
    }
  }

  PushFront(value: Entry) {
    const node = new ListNode(value, null, this.root);
    this.root = node;
    this.len += 1;
    return node;
  }
}
