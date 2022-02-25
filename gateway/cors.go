package main

import (
	"net/url"
	"strings"

	"github.com/labstack/echo/v4"
)

func SetCorsAllow(c echo.Context) {
	req := c.Request()

	// 最终的许可域从Origin头和Referer头中依次检测读取
	origin := req.Header.Get("Origin")
	referer := req.Header.Get("Referer")

	var sourceUrl string
	if origin != "" {
		sourceUrl = origin
	} else if referer != "" {
		sourceUrl = referer
	}
	urlObj, err := url.Parse(sourceUrl)
	if err != nil {
		return
	}

	// 设置跨域头
	setCorsHeader := func() {
		header := c.Response().Header()
		// header.Set("Access-Control-Allow-Headers", "Content-Type")
		// header.Set("Access-Control-Allow-Credentials", "true")
		header.Set("Access-Control-Allow-Origin", urlObj.Scheme+"://"+urlObj.Host)
		header.Set("Access-Control-Allow-Methods", req.Method)
	}

	if Mode == "dev" {
		// 开发环境始终允许所有
		setCorsHeader()
	} else if Mode == "prod" {
		// 正式环境从允许的域名列表中选取
		hostname := urlObj.Hostname()
		parts := strings.Split(hostname, ".")
		lenParts := len(parts)
		allow := false
		tmpHost := parts[len(parts)-1]
		for i := lenParts - 2; i >= 0; i-- {
			tmpHost = parts[i] + "." + tmpHost
			if Contains(AllowHosts, tmpHost) {
				allow = true
				break
			}
		}
		if allow {
			setCorsHeader()
		}
	}
}
