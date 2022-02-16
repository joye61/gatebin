package main

import "strconv"

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
