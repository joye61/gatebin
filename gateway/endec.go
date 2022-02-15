package main

import "io"

type Any = interface{}

type RequestBody struct {
	/// 头部放置各个数据段的长度
	UrlLen      uint16 /// 最大64K 2
	MethodLen   byte   /// 1
	HeadersLen  uint16 /// 最大64K 2
	DataLen     uint16 /// 2
	CookiesLen  uint16 /// 2
	FilesMapLen uint16 /// 2

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
func DecodeBody(body io.ReadCloser) *RequestBody {
	result := &RequestBody{}
	return result
}
