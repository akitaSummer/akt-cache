package lru

import "container/list"

type Value interface { // 存储值
	Len() int
}

type Cache struct {
	maxBytes  int64      // 最大内存
	nbytes    int64      // 已使用的内存
	ll        *list.List // 双向链表
	cache     map[string]*list.Element
	OnEvicted func(key string, value Value) // 清除条目时执行的函数
}

type entry struct { // 链表节点的数据类型
	key   string
	value Value
}

// 新建Cache
func New(maxBytes int64, OnEvicted func(string, Value)) *Cache {
	return &Cache{
		maxBytes:  maxBytes,
		ll:        list.New(),
		cache:     make(map[string]*list.Element),
		OnEvicted: OnEvicted,
	}
}

// 查询
func (c *Cache) Get(key string) (value Value, ok bool) {
	if ele, ok := c.cache[key]; ok {
		// 如果键对应的链表节点存在，则将对应节点移动到队尾，并返回查找到的值。
		c.ll.MoveToFront(ele)
		kv := ele.Value.(*entry)
		return kv.value, true
	}
	return
}

// 缓存淘汰
func (c *Cache) RemoveOldest() {
	ele := c.ll.Back()
	if ele != nil {
		// 移除队列首结点
		c.ll.Remove(ele)
		kv := ele.Value.(*entry)
		delete(c.cache, kv.key)
		c.nbytes -= int64(len(kv.key)) + int64(kv.value.Len())
		// 调用回调
		if c.OnEvicted != nil {
			c.OnEvicted(kv.key, kv.value)
		}
	}
}

// 新增/更新
func (c *Cache) Add(key string, value Value) {
	if ele, ok := c.cache[key]; ok {
		// 更新
		c.ll.MoveToFront(ele)
		kv := ele.Value.(*entry)
		c.nbytes += int64(value.Len()) - int64(kv.value.Len())
		kv.value = value
	} else {
		// 新建
		ele := c.ll.PushFront(&entry{key, value})
		c.cache[key] = ele
		c.nbytes += int64(len(key)) + int64(value.Len())
	}
	// 超出最大值则清除最少访问的节点
	for c.maxBytes != 0 && c.maxBytes < c.nbytes {
		c.RemoveOldest()
	}
}

// 查询数据数量
func (c *Cache) Len() int {
	return c.ll.Len()
}
