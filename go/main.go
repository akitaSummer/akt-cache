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

func main() {
	aktcache.NewGroup("num", 2048, aktcache.GetterFunc(
		func(key string) ([]byte, error) {
			log.Println("[slowDB] search key", key)
			if v, ok := db[key]; ok {
				return []byte(v), nil
			}
			return nil, fmt.Errorf("%s not exist", key)
		},
	))

	addr := "localhost:9999"
	peers := aktcache.NewHTTPPool(addr)
	log.Println("aktcache is running at", addr)
	log.Fatal(http.ListenAndServe(addr, peers))
}
