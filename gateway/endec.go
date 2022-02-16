package main

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
)

type Any = interface{}

type FileItem struct {
	Name string
	Size int32
}

type DataType struct {
	Url      string
	Method   string
	Headers  map[string]string
	Params   map[string]Any
	FilesMap []FileItem
}

type IncomingPackage struct {
	DataLen uint16
	Data    *DataType
	Files   [][]byte
}

/// 解码请求的body数据
func DecodeBody(body io.ReadCloser) (*IncomingPackage, error) {
	pack := &IncomingPackage{}
	// 首先读取两个字节，获取数据域的长度
	dataLenBuf := make([]byte, 2)
	dataLenN, _ := body.Read(dataLenBuf)
	if dataLenN != 2 {
		return nil, errors.New("error in decoding data length")
	}
	dataLen, _ := binary.Uvarint(dataLenBuf)
	pack.DataLen = uint16(dataLen)

	// 读取数据信息
	dataBuf := make([]byte, dataLen)
	dataN, _ := body.Read(dataBuf)
	if uint64(dataN) != dataLen {
		return nil, errors.New("error in decoding data")
	}
	// 将数据转换为json对象
	var data DataType
	jsonerr := json.Unmarshal(dataBuf, &data)
	if jsonerr != nil {
		return nil, jsonerr
	}
	pack.Data = &data

	// 读取文件信息
	if data.FilesMap != nil {
		pack.Files = [][]byte{}
		for _, file := range data.FilesMap {
			fileBuf := make([]byte, file.Size)
			fileN, _ := body.Read(fileBuf)
			if fileN != int(file.Size) {
				return nil, errors.New("error decoding file")
			}
			pack.Files = append(pack.Files, fileBuf)
		}
	}

	return pack, nil
}
