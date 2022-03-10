package main

import (
	"flag"
	"strings"
)

// 服务器名
var Server = "GateBin"

// dev | prod
var Mode = "dev"

// Port
var Port uint64 = 9003

// 网关路径
var GatewayEntry = "/__gb"

// 允许的域名列表
var AllowHosts = []string{}

func ParseArgs() {
	// 解析输入参数
	flag.StringVar(&Mode, "mode", "dev", "Set current execution environment: \"prod\" | \"dev\"")
	flag.Uint64Var(&Port, "port", 9003, "Set the listening port number of the gateway")
	flag.StringVar(&GatewayEntry, "entry", "/__gb", "Set the gateway entrance")

	var hosts string
	flag.StringVar(&hosts, "hosts", "", "Set the list of domain names allowed to be accessed, separated by half commas")
	if hosts != "" {
		parsedHosts := strings.Split(hosts, ",")
		for _, host := range parsedHosts {
			AllowHosts = append(AllowHosts, strings.Trim(host, " "))
		}
	}

	flag.Parse()
}
