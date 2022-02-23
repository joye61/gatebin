import { useEffect } from "react";
import post, { gatewayConfig } from "@";

gatewayConfig({
  debug: true,
  entry: "//10.10.33.70:9003/do",
});

export default function App() {
  useEffect(() => {
    post("https://map.baidu.com/search", {
      method: "POST",
      // headers: {
      //   "content-type": "application/json",
      // },
      body: {
        a: 1,
        b: "hello world 你好世界11",
        c: true,
        d: undefined,
        e: null,
        f: 1.92,
      },
    });
  }, []);

  return <>hello world</>;
}
