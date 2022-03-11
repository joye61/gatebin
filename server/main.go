package main

type Any = interface{}

func main() {
	ParseArgs()
	go CookieExpireManager()
	StartServer()
}
