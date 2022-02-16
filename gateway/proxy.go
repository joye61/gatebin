package main

import (
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/net/context"
)

/// 目前只允许GET和POST类型的代理请求
func ProxyRequest(c echo.Context, pack *IncomingPackage) (*http.Response, error) {
	data := pack.Data
	method := strings.ToUpper(data.Method)

	// 创建新的Request对象
	header := c.Request().Header.Clone()
	if data.Headers != nil {
		for key, value := range data.Headers {
			header.Set(key, value)
		}
	}

	// 请求体
	var body io.Reader
	if method == "GET" {
		// 当前实现不允许GET请求携带请求体
		body = nil
	}

	if method == "POST" {
		// TODO
	}

	// 创建超时context
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*30)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, method, data.Url, body)
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	return resp, nil
}
