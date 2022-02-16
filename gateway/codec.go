package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

type Any = interface{}

type FileItem struct {
	FieldName string
	FileName  string
	Size      int32
}

type RawInfo struct {
	SendAsRaw bool
	Size      int
}

type ParamsType struct {
	Url     string
	Method  string
	Headers map[string]string
	Params  map[string]Any
	Raw     RawInfo
	Files   []FileItem
}

type IncomingPackage struct {
	DataLen uint16
	Params  *ParamsType
	Files   [][]byte
	Raw     []byte
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
	dataLenReader := bytes.NewReader(dataLenBuf)
	var dataLen uint16
	binary.Read(dataLenReader, binary.BigEndian, &dataLen)
	pack.DataLen = dataLen

	// 读取数据信息
	dataBuf := make([]byte, dataLen)
	dataN, _ := body.Read(dataBuf)
	if uint16(dataN) != dataLen {
		return nil, errors.New("error in decoding data")
	}
	// 将数据转换为json对象
	var params ParamsType
	jsonerr := json.Unmarshal(dataBuf, &params)
	if jsonerr != nil {
		return nil, jsonerr
	}
	pack.Params = &params

	// 读取Raw信息
	if params.Raw.SendAsRaw {
		pack.Raw = make([]byte, params.Raw.Size)
		rawN, _ := body.Read(pack.Raw)
		if rawN != params.Raw.Size {
			return nil, errors.New("error decoding raw data")
		}
	}

	// 读取文件信息
	if params.Files != nil && len(params.Files) > 0 {
		pack.Files = [][]byte{}
		for _, file := range params.Files {
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

type OutCookie struct {
}

type OutParams struct {
	Headers http.Header `json:"headers"`
	Cookies []OutCookie `json:"cookies,omitempty"`
}

type OutgoingPackage struct {
	ParamsLen uint16
	Params    OutParams
	Raw       []byte
}

/// 编码远端返回的数据到body中返回给请求的客户端
func EncodeBody() {}
