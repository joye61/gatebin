package main

import (
	"sync"

	"github.com/google/uuid"
)

type Sid struct {
	mut *sync.Mutex
}

// 安全的创建sessionid
func (s *Sid) NewString() string {
	s.mut.Lock()
	defer s.mut.Unlock()
	return uuid.NewString()
}

var SidCreator = &Sid{
	mut: &sync.Mutex{},
}
