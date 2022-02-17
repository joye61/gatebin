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

	// 先解压数据
	defBuf := bytes.NewBuffer(dataBuf)
	dataBuf, defErr := DeCompress(defBuf, "zlib")
	if defErr != nil {
		return nil, defErr
	}

	// 将json字符串数据反序列化为json对象
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
	Headers       http.Header    `json:"headers"`
	Cookies       []*http.Cookie `json:"cookies,omitempty"`
	ContentLength uint64         `json:"contentLength,omitempty"`
}

/// 编码远端返回的数据到body中返回给请求的客户端
func EncodeBody(params *OutParams, Raw []byte) ([]byte, error) {
	// 对参数做json序列化，便于前端解析
	serial, err := json.Marshal(params)
	if err != nil {
		return nil, err
	}

	// 对参数数据做zlib压缩，隐藏敏感数据
	serial, err = Compress(serial, "zlib")
	if err != nil {
		return nil, errors.New("data compression anomaly")
	}

	paramsLen := uint16(len(serial))
	lenBuf := &bytes.Buffer{}
	berr := binary.Write(lenBuf, binary.BigEndian, paramsLen)
	if berr != nil {
		return nil, err
	}

	// 1、写入参数的长度信息
	output := bytes.Buffer{}
	ln, _ := output.Write(lenBuf.Bytes())
	if ln != 2 {
		return nil, errors.New("error in writing parameter length during encoding")
	}
	// 2、写入参数信息
	sn, _ := output.Write(serial)
	if sn != int(paramsLen) {
		return nil, errors.New("error in writing parameter during encoding")
	}
	// 3、写入原始Body
	rn, _ := output.Write(Raw)
	if rn != len(Raw) {
		return nil, errors.New("error in writing raw body during encoding")
	}

	return output.Bytes(), nil
}
