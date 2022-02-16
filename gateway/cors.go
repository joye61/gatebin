package main

import (
	"github.com/labstack/echo/v4"
)

func SetCorsAllow(c echo.Context) {
	method := c.Request().Method
	origin := c.Request().Header.Get("Origin")
	if origin == "" {
		origin = "*"
	}
	header := c.Response().Header()
	header.Set("Access-Control-Allow-Credentials", "true")
	header.Set("Access-Control-Allow-Origin", origin)
	header.Set("Access-Control-Allow-Methods", method)
	header.Set("Access-Control-Allow-Headers", "Content-Type")
}
