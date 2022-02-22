package main

import (
	"flag"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()
	e.HideBanner = true

	// 解析输入参数
	flag.StringVar(&Mode, "mode", "dev", "Set current execution environment: \"prod\" | \"dev\"")
	flag.Uint64Var(&Port, "port", 9003, "Set the listening port number of the gateway")
	flag.Parse()

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

	// 启动监听
	e.Logger.Fatal(e.Start(":" + strconv.FormatUint(Port, 10)))
}
