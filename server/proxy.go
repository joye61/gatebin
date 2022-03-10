package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"mime"
	"mime/multipart"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func ProxyRequest(c *gin.Context) {

	msg, err := Decode(c.Request.Body)
	if err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}

	// 重新拼装请求头
	headers := c.Request.Header.Clone()
	for key, value := range msg.Headers {
		headers.Set(key, value)
	}
	// 设置请求的最终目标Host
	urlObj, err := url.Parse(msg.Url)
	if err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}
	headers.Set("Host", urlObj.Host)

	// 获取请求体
	var body []byte
	if msg.RawBody.Enabled {
		body = msg.RawBody.Data
	} else {
		ctype := headers.Get("Content-Type")
		mtype, _, err := mime.ParseMediaType(ctype)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}

		switch mtype {
		case "application/x-www-form-urlencoded":
			values := url.Values{}
			for key, value := range msg.Params {
				result := ConvertValueToStr(value)
				values.Add(key, result)
			}
			body = []byte(values.Encode())
		case "multipart/form-data":
			w := &bytes.Buffer{}
			multi := multipart.NewWriter(w)
			// 填充数据字段
			for key, value := range msg.Params {
				result := ConvertValueToStr(value)
				multi.WriteField(key, result)
			}
			// 填充文件
			for _, item := range msg.Files {
				fw, err := multi.CreateFormFile(item.Key, item.Name)
				if err == nil {
					fw.Write(item.Data)
				}
			}
			multi.Close()
			headers.Set("Content-Type", multi.FormDataContentType())
			body = w.Bytes()
		}
	}

	// 创建超时context
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*30)
	defer cancel()

	// 创建请求对象
	req, err := http.NewRequestWithContext(
		ctx,
		msg.Method,
		strings.Trim(msg.Url, " "),
		bytes.NewBuffer(body),
	)
	if err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}
	// 更新请求头
	req.Header = headers
	// 发送请求
	client := &http.Client{}
	// 开发环境跳过https证书验证
	if Mode == "dev" {
		client.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}
	}
	resp, err := client.Do(req)
	if err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}

	// 设置头部
	respHeaders := resp.Header.Clone()
	// 这里有解析COOKIE逻辑TODO
	// 删除所有的COOKIE
	respHeaders.Del("Set-Cookie")

	// 响应体有可能是gzip压缩之后的数据
	ctype := resp.Header.Get("Content-Encoding")
	respBody, err := DeCompress(resp.Body, ctype)
	if err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}

	// 声明响应消息
	responseMessage := &ResponseMessage{
		Compress: msg.Compress,
		Params: &ResponseParam{
			Code:    resp.StatusCode,
			Headers: respHeaders,
		},
		Body: respBody,
	}

	respMsg, err := Encode(responseMessage)
	if err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}

	c.Header("Content-Length", strconv.FormatInt(int64(len(respMsg)), 10))
	c.Header("Server", Server)

	c.Data(http.StatusOK, "application/octet-stream", respMsg)
}
