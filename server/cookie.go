package main

import (
	"net/http"
	"strings"
	"sync"
	"time"
	_ "time/tzdata"

	"github.com/gin-gonic/gin"
)

type GBCookie struct {
	*http.Cookie
	CreateTime time.Time
}

// cookie列表结构
//  {
//     "a.com" : {
//				"name1": *GBCookie,
//				"name2": *GBCookie
//  		},
//     "b.com" : {
//				"name1": *GBCookie,
//				"name2": *GBCookie
//  		},
//			...
//  }
type DomainCookies map[string](map[string]*GBCookie)

type SingleUserCookies struct {
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

// 过滤一个列表中过期的cookie
func GetValidDomainCookies(now time.Time, oldList map[string]*GBCookie) map[string]*GBCookie {
	newList := map[string]*GBCookie{}
	for name, value := range oldList {
		duration := value.MaxAge * int(time.Second)
		if now.Before(value.CreateTime.Add(time.Duration(duration))) {
			newList[name] = value
		}
	}
	return newList
}

// 发送当前请求对应的COOKIE
func SendUserCookie(allowHost string, c *gin.Context, req *http.Request) {
	domainList := GetDomainCheckList(allowHost)
	sid, err := c.Cookie(SessionIDName)
	if err == nil {
		userItem, ok := StoreCache[sid]
		if ok {
			for _, domain := range domainList {
				clist := GetValidDomainCookies(time.Now(), userItem.List[domain])
				for _, cookie := range clist {
					req.AddCookie(&http.Cookie{
						Name:  cookie.Name,
						Value: cookie.Value,
					})
				}
				// 更新当前域下的COOKIE列表
				userItem.l.Lock()
				userItem.List[domain] = clist
				userItem.l.Unlock()
			}
		}
	}
}

// 保存远端服务器下发的COOKIE
func SaveUserCookie(allowHost string, c *gin.Context, resp *http.Response) {
	// 如果响应中没有任何cookie，不做任何处理
	if len(resp.Cookies()) == 0 {
		return
	}

	// 读取用户传入的sid
	sid, err := c.Cookie(SessionIDName)

	if err == nil {
		// err 为空代表用户传了sessionid
		userItem, ok := StoreCache[sid]
		if ok {
			// 用户传了sessionid，且缓存中能找到新值，更新记录
			UpdateUserCookies(allowHost, userItem, resp.Cookies())
			StoreCache[sid] = userItem
		} else {
			// 用户传了sessionid，但是缓存中找不到存储，创建记录
			CreateNewCookieStore(allowHost, c, resp)
		}
	} else {
		// 用户没有传sessionid，创建记录
		CreateNewCookieStore(allowHost, c, resp)
	}
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

// 为用户创建新的COOKIE存储空间
func CreateNewCookieStore(allowHost string, c *gin.Context, resp *http.Response) {
	// 如果响应中有cookie，需要生成新的sessionid并响应给客户端
	now := time.Now()
	userItem := &SingleUserCookies{
		LastVisitTime: now,
		List:          DomainCookies{},
		l:             &sync.RWMutex{},
	}

	// 更新userItem
	UpdateUserCookies(allowHost, userItem, resp.Cookies())

	// 创建sessionid
	sid := SidCreator.NewString()
	// 创建sessionid写入对应的cookie
	c.SetCookie(
		SessionIDName,
		sid,
		// SESSIONID的过期时间为30天
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

// 根据远端返回的cookie更新当前的列表
func UpdateUserCookies(
	allowHost string,
	userCookies *SingleUserCookies,
	newList []*http.Cookie,
) {
	// 写锁定
	userCookies.l.Lock()
	defer userCookies.l.Unlock()

	var list = userCookies.List
	if list == nil {
		list = DomainCookies{}
	}
	// 首先判断旧列表的过期逻辑，过期的全部清理
	now := time.Now()

	// 获取即将要检查的域名列表
	checkList := GetDomainCheckList(allowHost)

	// 将新列表覆盖到原列表，同名的全部覆盖处理
	for _, value := range newList {
		// 没有名字的cookie不做任何处理
		name := value.Name
		if name == "" {
			continue
		}

		domain := strings.TrimLeft(value.Domain, ".")
		// 不合法的域，不允许写入
		if !Contains(checkList, domain) {
			continue
		}

		// 当前域下的cookie过期清理逻辑，只要访问就会触发
		newTmpList := GetValidDomainCookies(now, list[domain])

		// 接下来判断时间逻辑，确保最终存储的MaxAge有值
		if value.MaxAge < 0 {
			// 立即删除
			delete(newTmpList, name)
		} else if value.MaxAge == 0 {
			// 没有MaxAge字段，判断Expire
			sub := time.Until(value.Expires)
			if sub < 0 {
				delete(newTmpList, name)
			} else if sub == 0 {
				// 如果是session cookie 默认1小时过期
				value.MaxAge = 1 * 60 * int(time.Second)
				// 写入Cookie
				newTmpList[name] = &GBCookie{
					value,
					now,
				}
			} else {
				// 如果maxage不存在，但是expires大于0，则重新生成maxAge
				value.MaxAge = int(sub.Seconds())
				newTmpList[name] = &GBCookie{
					value,
					now,
				}
			}
		} else {
			// MaxAge>0的情况
			newTmpList[name] = &GBCookie{
				value,
				now,
			}
		}

		// 更新该域下对应的COOKIE列表
		if len(newTmpList) > 0 {
			list[domain] = newTmpList
		}
	}

	// 更新用户的COOKIE列表
	userCookies.LastVisitTime = now
	userCookies.List = list
}

// 检测用户存储区的COOKIE过期逻辑
func CheckUserCookieExpire() {
	now := time.Now()
	for sid, userCookies := range StoreCache {
		userCookies.l.Lock()
		// 如果距离上次访问时间查过30天，则清理当前sid下的所有数据
		dur := time.Since(userCookies.LastVisitTime)
		if dur > 30*24*time.Hour {
			continue
		}

		// 首先判断旧列表的过期逻辑，过期的全部清理
		for domain, oldList := range userCookies.List {
			tmpList := map[string]*GBCookie{}
			for name, gbcookie := range oldList {
				duration := gbcookie.MaxAge * int(time.Second)
				if now.Before(gbcookie.CreateTime.Add(time.Duration(duration))) {
					tmpList[name] = gbcookie
				}
			}
			if len(tmpList) > 0 {
				userCookies.List[domain] = tmpList
			} else {
				delete(userCookies.List, domain)
			}
		}

		// 只有当cookie列表有数据时才更新
		if len(userCookies.List) > 0 {
			StoreCache[sid] = userCookies
		}
		userCookies.l.Unlock()
	}
}

// 定时的清理cookie
func CookieExpireManager() {
	t := time.NewTicker(5 * 24 * time.Hour)
	for {
		<-t.C
		go CheckUserCookieExpire()
	}
}
