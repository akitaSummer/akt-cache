package aktcache

import (
	"AktCache/aktcache"
	"fmt"
	"log"
	"net/http"
)

var db = map[string]string{
	"akt":         "123",
	"akita":       "321",
	"akitasummer": "213",
}

func createGroup() *aktcache.Group {
	return aktcache.NewGroup("num", 2048, aktcache.GetterFunc(
		func(key string) ([]byte, error) {
			log.Println("[slowDB] search key", key)
			if v, ok := db[key]; ok {
				return []byte(v), nil
			}
			return nil, fmt.Errorf("%s not exist", key)
		},
	))
}

func startCacheServer(addr string, addrs []string, akt *aktcache.Group) {
	peers := aktcache.NewHTTPPool(addr)
	peers.Set(addrs...)
	akt.RegisterPeers(peers)
	log.Println("aktcache is running at", addr)
	log.Fatal(http.ListenAndServe(addr[7:], peers))
}

func startAPIServer(apiAddr string, akt *aktcache.Group) {
	http.Handle("/api", http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			key := r.URL.Query().Get("key")
			view, err := akt.Get(key)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/octet-stream")
			w.Write(view.ByteSlice())

		}))
	log.Println("fontend server is running at", apiAddr)
	log.Fatal(http.ListenAndServe(apiAddr[7:], nil))
}

func main() {
	apiAddr := "http://localhost:9999"
	addrMap := map[int]string{
		8001: "http://localhost:8001",
		8002: "http://localhost:8002",
		8003: "http://localhost:8003",
	}

	var addrs []string
	for _, v := range addrMap {
		addrs = append(addrs, v)
	}

	akt := createGroup()

	go startAPIServer(apiAddr, akt)

	startCacheServer(addrMap[8001], []string(addrs), akt)

}
