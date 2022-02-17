package main

import (
	"compress/flate"
	"compress/gzip"
	"compress/zlib"
	"errors"
	"io"
	"io/ioutil"
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
		return ioutil.ReadAll(gz)
	case "compress": /// LZW
		// TODO
		return nil, errors.New("LZW format decompression is not supported at this time")
	case "deflate": /// DEFLATE
		def := flate.NewReader(body)
		defer def.Close()
		return ioutil.ReadAll(def)
	case "br": /// Brotli
		return ioutil.ReadAll(brotli.NewReader(body))
	case "zlib": /// zlib
		zlib, err := zlib.NewReader(body)
		if err != nil {
			return nil, err
		}
		defer zlib.Close()
		return ioutil.ReadAll(zlib)
	default:
		// 表示没有压缩
		return ioutil.ReadAll(body)
	}

}
