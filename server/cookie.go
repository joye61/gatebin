package main

import (
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
	_ "time/tzdata"

	"github.com/gin-gonic/gin"
)

type DomainCookies map[string]([]*http.Cookie)

type SingleUserCookies struct {
	// 创建时间
	CreateTime time.Time
	// 过期时间
	Duration time.Duration
	// 上次访问时间
	LastVisitTime time.Time
	// 对应的列表
	List DomainCookies
	// 一把读写锁
	l *sync.RWMutex
}

// 存储所有的额cookie相关的数据
var csl = &sync.RWMutex{}

type CookieStore map[string]*SingleUserCookies

// 定义cookie的存储
var StoreCache = CookieStore{}

// Cookie的验证逻辑
func CookieCheck(msg *RequestMessage, c *gin.Context, resp *http.Response) {

	// 最终请求的URL解析
	urlInstance, err := url.Parse(msg.Url)
	if err != nil {
		return
	}
	allowHost := urlInstance.Hostname()

	// 读取用户传入的sid
	sid, err := c.Cookie(SessionIDName)

	if err == nil {
		// 收到sessionID
		// 查看缓存中是否有对应的键
		userItem, ok := StoreCache[sid]
		// 只有用户传的sid在缓存中有记录才处理读取逻辑
		if ok {

			return
		}
	}

	// 其余所有情况创建新的cookie存储
	CreateNewCookieStore(allowHost, c, resp)

}

// 检测某个domain是否可以写入
func GetDomainCheckList(allowHost string) []string {
	// 判断服务端返回的COOKIE是否允许写入
	segs := strings.Split(allowHost, ".")
	checkList := []string{}
	temp := segs[len(segs)-1]
	for i := len(segs) - 2; i >= 0; i-- {
		temp = segs[i] + "." + temp
		checkList = append(checkList, temp)
	}
	return checkList
}

// 更新用户的COOKIE存储空间，包含过期等逻辑
func UpdateCookieStore(allowHost string, c *gin.Context, resp *http.Response) {}

// 为用户创建新的COOKIE存储空间
func CreateNewCookieStore(allowHost string, c *gin.Context, resp *http.Response) {
	// 如果响应中没有任何cookie，不做任何处理
	if len(resp.Cookies()) == 0 {
		return
	}
	// 如果响应中有cookie，需要生成新的sessionid并响应给客户端
	now := time.Now()
	userItem := &SingleUserCookies{
		CreateTime:    now,
		Duration:      30 * 24 * time.Hour,
		LastVisitTime: now,
		List:          DomainCookies{},
		l:             &sync.RWMutex{},
	}

	// 获取即将要检查的域名列表
	checkList := GetDomainCheckList(allowHost)

	// 检查服务端返回的所有COOKIE合法性，只能写入自身域下的cookie
	for _, cookie := range resp.Cookies() {
		domain := strings.TrimLeft(cookie.Domain, ".")
		if Contains(checkList, domain) {
			clist := []*http.Cookie{}
			userItem.List[domain] = append(clist, cookie)
		}
	}

	// 创建sessionid
	sid := SidCreator.NewString()
	// 创建sessionid写入对应的cookie
	c.SetCookie(
		SessionIDName,
		sid,
		30*24*60*60,
		"/",
		"",
		Mode == "prod",
		true,
	)

	// 将新创建的cookie写入本地
	csl.Lock()
	StoreCache[sid] = userItem
	csl.Unlock()
}
