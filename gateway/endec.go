package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"io"
)

type Any = interface{}

type RequestBody struct {
	/// 数据域的长度
	DataLen uint16 /// 2个字节 最大表示64K

	/// 主体部分按照头部顺序读取
	Url    string
	Method string
	/// 自定义的头部
	Headers map[string]string
	/// 将数据和文件分开，便于JSON解析
	Data    map[string]string
	Cookies map[string]string
	/// 这是个切片类型，因为要标识后续文件的顺序
	/// 键为文件对应的名字，值为文件长度
	FilesMap []map[string]uint32
	/// 单文件最大4G
	Files map[string][]byte
}

/// 解码请求的body数据
func DecodeBody(body io.ReadCloser) (*RequestBody, error) {
	// 首先读取两个字节，获取数据域的长度
	p := make([]byte, 2)
	_, err := body.Read(p)
	if err != nil {
		return nil, err
	}
	dataLenReader := bytes.NewReader(p)
	var dataLen uint16
	binary.Read(dataLenReader, binary.LittleEndian, &dataLen)

	t, _ := binary.Uvarint(p)
	fmt.Printf("NoOrder数据域长度：%#d", t)

	fmt.Printf("数据域长度：%#d", dataLen)

	result := &RequestBody{}
	return result, nil
}
