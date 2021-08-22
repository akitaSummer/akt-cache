package aktcache

import (
	"fmt"
	"reflect"
	"testing"
)

var db = map[string]string{
	"akt":         "123",
	"akita":       "321",
	"akitasummer": "213",
}

func TestGetter(t *testing.T) {
	var f Getter = GetterFunc(func(key string) ([]byte, error) {
		return []byte(key), nil
	})

	expect := []byte("key")
	if v, _ := f.Get("key"); !reflect.DeepEqual(v, expect) {
		t.Fatalf("callback failed")
	}
}

func TestGet(t *testing.T) {
	loadCounts := make(map[string]int, len(db)) // 统计get调用次数
	akt := NewGroup("num", 2048, GetterFunc(
		func(key string) ([]byte, error) {
			if v, ok := db[key]; ok {
				if _, ok := loadCounts[key]; !ok {
					loadCounts[key] = 0
				}
				loadCounts[key] += 1
				return []byte(v), nil
			}
			return nil, fmt.Errorf("%s not exist", key)
		},
	))

	for k, v := range db {
		// 如果cache值不正确
		if view, err := akt.Get(k); err != nil || view.String() != v {
			t.Fatalf("failed to get value")
		}

		// 如果get调用超过一次
		if _, err := akt.Get(k); err != nil || loadCounts[k] > 1 {
			t.Fatalf("cache %s miss", k)
		}
	}

	if view, err := akt.Get("test"); err == nil {
		t.Fatalf("this value is should be empty, but got %s", view)
	}
}

func TestGetGroup(t *testing.T) {
	groupName := "num"
	NewGroup(groupName, 2048, GetterFunc(
		func(key string) (bytes []byte, err error) { return }))
	if group := GetGroup(groupName); group == nil || group.name != groupName {
		t.Fatalf("group %s not exist", groupName)
	}

	if group := GetGroup(groupName + "111"); group != nil {
		t.Fatalf("expect nil, but %s got", group.name)
	}
}
