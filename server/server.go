package main

import "github.com/gin-gonic/gin"

func StartServer() {
	r := gin.Default()
	r.POST(GatewayEntry, func(c *gin.Context) {

	})

	r.OPTIONS(GatewayEntry, func(c *gin.Context) {

	})

	// r.POST("/__gb", func(c echo.Context) error {
	// 	// 允许跨域请求
	// 	SetCorsAllow(c)
	// 	// 代理请求到远端主机
	// 	return ProxyRequest(c)
	// })

	// r.OPTIONS("/__gb", func(c echo.Context) error {
	// 	SetCorsAllow(c)
	// 	return c.String(http.StatusOK, "")
	// })
}
