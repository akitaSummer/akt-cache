package aktcache

type PeerPicker interface {
	// 根据key获取对应结点的PeerGetter
	PickPeer(key string) (peer PeerGetter, ok bool)
}

type PeerGetter interface {
	// 从对应group获取缓存值
	Get(group string, key string) ([]byte, error)
}
