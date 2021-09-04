package aktcache

import pb "AktCache/aktcachepb"

type PeerPicker interface {
	// 根据key获取对应结点的PeerGetter
	PickPeer(key string) (peer PeerGetter, ok bool)
}

type PeerGetter interface {
	// 从对应group获取缓存值
	Get(in *pb.Request, out *pb.Response) error
}
