package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"io"
	"io/ioutil"
	"mime"
	"mime/multipart"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"google.golang.org/protobuf/proto"
)

func ProxyRequest(c echo.Context) error {
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		LogError(c, 1, err)
		return err
	}

	// 读取body的数据
	compressOpen := body[0] == 1
	pureBody := body[1:]
	if compressOpen {
		pureBody, err = DeCompress(bytes.NewBuffer(pureBody), "zlib")
		if err != nil {
			LogError(c, 2, err)
			return err
		}
	}

	// 解码收到的数据
	var requestMessage RequestMessage
	err = proto.Unmarshal(pureBody, &requestMessage)
	if err != nil {
		LogError(c, 3, err)
		return err
	}

	// 重新拼装请求头
	headers := c.Request().Header.Clone()
	reqHeaders := requestMessage.GetHeaders()
	for key, value := range reqHeaders {
		headers.Set(key, value)
	}
	// 设置请求的最终目标Host
	urlObj, err := url.Parse(requestMessage.GetUrl())
	if err != nil {
		LogError(c, 10, err)
		return err
	}
	headers.Set("Host", urlObj.Host)

	// 封装请求体
	rawBody := requestMessage.GetRawBody()
	var sendBody io.Reader
	if rawBody.GetEnabled() {
		ctype := rawBody.GetType()
		if ctype == 0 {
			content := rawBody.GetAsPlain()
			// 文本原始内容
			sendBody = bytes.NewReader([]byte(content))
		} else if ctype == 1 {
			// 二进制原始内容
			sendBody = bytes.NewReader(rawBody.GetAsBinary())
		}
	} else {
		ctype := headers.Get("Content-Type")
		mtype, _, err := mime.ParseMediaType(ctype)
		if err != nil {
			LogError(c, 4, err)
			return err
		}
		switch mtype {
		case "application/x-www-form-urlencoded":
			values := url.Values{}
			for key, value := range requestMessage.GetParams() {
				result := ConvertValueToStr(value)
				values.Add(key, result)
			}
			sendBody = bytes.NewReader([]byte(values.Encode()))
		case "multipart/form-data":
			w := &bytes.Buffer{}
			multi := multipart.NewWriter(w)
			// 填充数据字段
			for key, value := range requestMessage.GetParams() {
				result := ConvertValueToStr(value)
				multi.WriteField(key, result)
			}
			// 填充文件
			for _, item := range requestMessage.GetFiles() {
				fw, err := multi.CreateFormFile(item.Key, item.Name)
				if err == nil {
					fw.Write(item.Data)
				}
			}
			multi.Close()
			headers.Set("Content-Type", multi.FormDataContentType())
			sendBody = w
		}
	}

	// 创建超时context
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*30)
	defer cancel()

	// 创建请求对象
	req, err := http.NewRequestWithContext(
		ctx,
		requestMessage.GetMethod(),
		strings.Trim(requestMessage.GetUrl(), " "),
		sendBody,
	)
	if err != nil {
		LogError(c, 5, err)
		return err
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
		LogError(c, 6, err)
		return err
	}

	// 声明响应消息
	var responseMessage = &ResponseMessage{
		Code: uint32(resp.StatusCode),
	}

	// 设置头部
	respHeaders := map[string]*HeaderValue{}
	for key, value := range resp.Header {
		respHeaders[strings.ToLower(key)] = &HeaderValue{
			Value: value,
		}
	}
	responseMessage.Headers = respHeaders

	// 响应体有可能是gzip压缩之后的数据
	compress := resp.Header.Get("Content-Encoding")
	respBody, err := DeCompress(resp.Body, compress)
	if err != nil {
		LogError(c, 7, err)
		return err
	}
	responseMessage.Body = respBody

	// 响应消息进行编码
	respData, err := proto.Marshal(responseMessage)
	if err != nil {
		LogError(c, 8, err)
		return err
	}

	// 如果启用了压缩，则响应压缩之后的数据
	if compressOpen {
		respData, err = Compress(respData, "zlib")
		if err != nil {
			LogError(c, 9, err)
			return err
		}
	}

	// 填充响应头中的内容长度
	c.Response().Header().Set("Content-Length", strconv.FormatInt(int64(len(respData)), 10))
	c.Response().Header().Set("Server", ServerName)

	// 发送响应
	return c.Blob(http.StatusOK, echo.MIMEOctetStream, respData)
}
