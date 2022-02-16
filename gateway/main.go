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
		pack, err := DecodeBody(c.Request().Body)
		if err != nil {
			fmt.Println(err.Error())
			return c.String(http.StatusInternalServerError, http.StatusText(http.StatusInternalServerError))
		}
		ProxyRequest(c, pack)
		// 允许跨域请求
		SetCorsAllow(c)
		return c.String(http.StatusOK, http.StatusText(http.StatusOK))
	})

	e.OPTIONS("/do", func(c echo.Context) error {
		SetCorsAllow(c)
		return c.String(http.StatusOK, "")
	})

	e.Logger.Fatal(e.Start(":5000"))
}
