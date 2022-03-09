package main

import "io"

type RawBodyData struct {
	Enabled  bool
	Size     uint32
	DataType byte
	Data     []byte
}

type FileItem struct {
	Key  string
	Name string
	Data []byte
}

type RequestMessage struct {
	Compress bool
	Url      string
	Method   string
	Headers  map[string]string
	RawBody  *RawBodyData
	Files    []RawBodyData
}

type ResponseMessage struct {
}

func encode(respMsg ResponseMessage) []byte {
	return []byte{}
}

// 解码输入的数据
func decode(data io.Reader) (*RequestMessage, error) {
	message := &RequestMessage{}

	// 读取是否压缩相关的数据
	var compressData = make([]byte, 1)
	n, err := data.Read(compressData)
	if n != 1 {
		return nil, err
	}
	message.Compress = compressData[0] == 1

	// 如果有压缩

	return &RequestMessage{}
}
