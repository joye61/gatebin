package main

import (
	"bytes"
	"compress/flate"
	"compress/gzip"
	"compress/zlib"
	"errors"
	"io"
	"strconv"

	"github.com/andybalholm/brotli"
)

func ConvertValueToStr(value Any) string {
	var result string
	switch i := value.(type) {
	case nil:
		result = "null"
	case string:
		result = i
	case float64:
		result = strconv.FormatFloat(float64(i), 'E', -1, 64)
	case bool:
		result = strconv.FormatBool(i)
	}
	return result
}

// 解压数据的逻辑
func DeCompress(body io.Reader, method string) ([]byte, error) {
	switch method {
	case "gzip": /// GZIP
		gz, err := gzip.NewReader(body)
		if err != nil {
			return nil, err
		}
		defer gz.Close()
		return io.ReadAll(gz)
	case "compress": /// LZW
		// TODO
		return nil, errors.New("LZW format decompression is not supported at this time")
	case "deflate": /// DEFLATE
		def := flate.NewReader(body)
		defer def.Close()
		return io.ReadAll(def)
	case "br": /// Brotli
		return io.ReadAll(brotli.NewReader(body))
	case "zlib": /// zlib
		zlib, err := zlib.NewReader(body)
		if err != nil {
			return nil, err
		}
		defer zlib.Close()
		return io.ReadAll(zlib)
	default:
		// 表示没有压缩
		return io.ReadAll(body)
	}
}

// 压缩数据逻辑
func Compress(data []byte, method string) ([]byte, error) {
	switch method {
	case "zlib":
		buf := &bytes.Buffer{}
		w := zlib.NewWriter(buf)
		defer w.Close()
		_, err := w.Write(data)
		if err != nil {
			return nil, err
		}
		err = w.Close()
		if err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	default:
		return data, nil
	}
}

// 判断列表中是否包含某个元素
func Contains(list []string, item string) bool {
	for _, value := range list {
		if value == item {
			return true
		}
	}
	return false
}
