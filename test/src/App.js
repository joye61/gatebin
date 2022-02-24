import { useEffect, useState } from "react";
import post, { GatewayConfig } from "@";

GatewayConfig({
  debug: true,
  entry: "//10.10.33.70:9003/do",
});

async function test() {
  const resp = await post("https://clto.cc/YQ7FtSuk");
  // const resp = await post("https://chelun.com");
  const result = await resp.text();
  // console.log(result, 1111);
}

export default function App() {
  const [src, setSrc] = useState("");

  let du = `data:image/webp;base64,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`;

  useEffect(() => {
    test();
  }, []);

  return (
    <>
      hello world
      {/* <link rel="stylesheet" href={src} /> */}
      {src && <img src={src} width="600" />}
    </>
  );
}
