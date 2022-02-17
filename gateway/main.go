package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()
	e.HideBanner = true

	e.POST("/do", func(c echo.Context) error {
		// 允许跨域请求
		SetCorsAllow(c)
		// 代理请求到远端主机
		return ProxyRequest(c)
	})

	e.OPTIONS("/do", func(c echo.Context) error {
		SetCorsAllow(c)
		return c.String(http.StatusOK, "")
	})

	e.Logger.Fatal(e.Start(":5000"))
}
