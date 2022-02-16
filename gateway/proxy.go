package main

import (
	"bytes"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/net/context"
)

/// 目前只允许GET和POST类型的代理请求
func ProxyRequest(c echo.Context, pack *IncomingPackage) (*http.Response, error) {
	data := pack.Params
	method := strings.ToUpper(data.Method)

	// 重新拼装请求头
	header := c.Request().Header.Clone()
	if data.Headers != nil {
		for key, value := range data.Headers {
			header.Set(key, value)
		}
	}

	// 解析并拼装请求体
	var body io.Reader
	if data.Raw.SendAsRaw {
		body = bytes.NewReader(pack.Raw)
	} else {
		ctype := header.Get("Content-Type")
		mtype, _, err := mime.ParseMediaType(ctype)
		if err != nil {
			return nil, err
		}
		switch mtype {
		case "application/x-www-form-urlencoded":
			values := url.Values{}
			for key, value := range data.Params {
				result := ConvertValueToStr(value)
				values.Add(key, result)
			}
			body = bytes.NewReader([]byte(values.Encode()))
		case "multipart/form-data":
			body := &bytes.Buffer{}
			multi := multipart.NewWriter(body)
			// 填充数据字段
			for key, value := range data.Params {
				result := ConvertValueToStr(value)
				multi.WriteField(key, result)
			}
			// 填充文件
			for index, item := range data.Files {
				fw, err := multi.CreateFormFile(item.FieldName, item.FileName)
				if err == nil {
					fw.Write(pack.Files[index])
				}
			}
			multi.Close()
		}
	}

	// 创建超时context
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*30)
	defer cancel()

	// 创建请求对象
	req, err := http.NewRequestWithContext(ctx, method, data.Url, body)
	if err != nil {
		return nil, err
	}
	// 更新请求头
	req.Header = header
	// 发送请求
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	fmt.Printf("222 %#v", resp.Header)

	return resp, nil
}

func HandleRemoteResponse(resp *http.Response) {}
