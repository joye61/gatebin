package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()
	e.HideBanner = true

	e.POST("/do", func(c echo.Context) error {
		// 允许跨域请求
		SetCorsAllow(c)
		// 解包请求数据包
		pack, err := DecodeBody(c.Request().Body)
		// 任何解包过程中的失败都直接返回
		if err != nil {
			fmt.Println(err.Error())
			return c.String(http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		}
		// 代理请求到远端主机
		ProxyRequest(c, pack)
		// 响应请求
		return c.String(http.StatusOK, http.StatusText(http.StatusOK))
	})

	e.OPTIONS("/do", func(c echo.Context) error {
		SetCorsAllow(c)
		return c.String(http.StatusOK, "")
	})

	e.Logger.Fatal(e.Start(":5000"))
}
