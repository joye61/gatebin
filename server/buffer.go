package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RawBodyData struct {
	Enabled bool
	Size    uint32
	Type    byte
	Data    []byte
}

type FileItem struct {
	Key  string
	Name string
	Size uint32
	Data []byte
}

type RequestMessage struct {
	Compress bool
	Url      string
	Method   string
	Headers  map[string]string
	Params   map[string]string
	RawBody  *RawBodyData
	Files    []*FileItem
}

// 解码输入的数据
func Decode(body io.Reader) (*RequestMessage, error) {
	message := &RequestMessage{}

	data, err := io.ReadAll(body)
	if err != nil {
		return nil, err
	}

	// 读取解析是否压缩
	message.Compress = data[0] == 1

	// 读取数据部分
	part := data[1:]
	if message.Compress {
		part, err = DeCompress(bytes.NewBuffer(part), "zlib")
		if err != nil {
			return nil, err
		}
	}

	var offset uint32 = 4
	// 读取参数长度
	paramLen := binary.BigEndian.Uint32(part[0:4])
	err = json.Unmarshal(part[offset:offset+paramLen], &message)
	if err != nil {
		return nil, err
	}
	offset += paramLen

	// 读取原生body
	rawBody := message.RawBody
	if rawBody.Enabled && rawBody.Size > 0 {
		rawBody.Data = part[offset : offset+rawBody.Size]
		offset += rawBody.Size
	}

	// 读取文件列表
	for _, file := range message.Files {
		file.Data = part[offset : offset+file.Size]
		offset += file.Size
	}

	return message, nil
}

type ResponseParam struct {
	Code    int         `json:"code"`
	Headers http.Header `json:"headers"`
}

type ResponseMessage struct {
	Compress bool
	Params   *ResponseParam
	Body     []byte
}

// 发送错误的页面
func InternalServerError(c *gin.Context, compress bool, err error) {
	fmt.Println(err.Error())
	headers := http.Header{}
	headers.Add("Content-Type", gin.MIMEHTML)
	msg := &ResponseMessage{
		Compress: compress,
		Params: &ResponseParam{
			Code:    http.StatusInternalServerError,
			Headers: headers,
		},
		Body: []byte(http.StatusText(http.StatusInternalServerError)),
	}
	body, encodeErr := Encode(msg)
	if encodeErr != nil {
		c.Status(http.StatusInternalServerError)
		return
	}
	c.Data(http.StatusOK, "application/octet-stream", body)
}

// 编码响应客户端的数据
func Encode(respMsg *ResponseMessage) ([]byte, error) {

	// 生成参数数据
	paramData, err := json.Marshal(respMsg.Params)
	if err != nil {
		return nil, err
	}

	// 生成参数长度数据
	paramLen := make([]byte, 4)
	binary.BigEndian.PutUint32(paramLen, uint32(len(paramData)))

	part := &bytes.Buffer{}
	part.Write(paramLen)
	part.Write(paramData)
	part.Write(respMsg.Body)

	// 生成是否压缩的参数
	cValue := 0
	if respMsg.Compress {
		cValue = 1
	}

	// 如果有压缩参数，进行压缩
	var partData = part.Bytes()
	if cValue == 1 {
		partData, err = Compress(part.Bytes(), "zlib")
		if err != nil {
			return nil, err
		}
	}

	// 生成最终的响应二进制数据
	compress := []byte{byte(cValue)}
	body := &bytes.Buffer{}
	body.Write(compress)
	body.Write(partData)

	return body.Bytes(), nil
}
