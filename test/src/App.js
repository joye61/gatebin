import { useEffect, useState } from "react";
import post, { gatewayConfig } from "@";

gatewayConfig({
  debug: true,
  entry: "//10.10.33.70:9003/do",
});

async function test() {
  const resp = await post("https://map.baidu.com/search");
  const result = await resp.text();
  console.log(result, 1111);
}

export default function App() {
  const [src, setSrc] = useState("");

  useEffect(() => {
    (async () => {
      const resp = await post(
        "https://www.chelun.com/_next/static/css/0bfb61fb670cefde6350.css"
      );
      const result = await resp.blobUrl();
      setSrc(result);
      setTimeout(()=>{
        // resp.download()
      }, 3000)
    })();
  }, []);

  return (
    <>
      hello world
      {src && <img src={src} width="600" />}
    </>
  );
}
