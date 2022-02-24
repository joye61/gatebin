package main

import (
	"net/url"
	"strings"

	"github.com/labstack/echo/v4"
)

func SetCorsAllow(c echo.Context) {
	method := c.Request().Method
	origin := c.Request().Header.Get("Origin")

	setCorsHeader := func() {
		if origin == "" {
			origin = "*"
		}
		header := c.Response().Header()
		// header.Set("Access-Control-Allow-Credentials", "true")
		header.Set("Access-Control-Allow-Origin", origin)
		header.Set("Access-Control-Allow-Methods", method)
		// header.Set("Access-Control-Allow-Headers", "Content-Type")
	}

	if Mode == "dev" {
		// 开发环境始终允许所有
		setCorsHeader()
	} else if Mode == "prod" {
		// 正式环境从允许的域名列表中选取
		url, err := url.Parse(origin)
		if err == nil {
			hostname := url.Hostname()
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
}
