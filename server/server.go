package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func StartServer() {
	r := gin.Default()
	r.POST(GatewayEntry, func(c *gin.Context) {
		SetCorsAllow(c)
		ProxyRequest(c)
	})

	r.OPTIONS(GatewayEntry, func(c *gin.Context) {
		SetCorsAllow(c)
		c.Status(http.StatusOK)
	})

	r.Run(":" + strconv.FormatInt(int64(Port), 10))
}
