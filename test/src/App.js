import { useEffect, useState } from "react";
import post, { gatewayConfig } from "@";
import { InterfaceTest } from "./Interface";

gatewayConfig({
  debug: true,
  entry: "//10.10.33.70:9003/do",
});

async function test() {
  const resp = await post("https://clto.cc/YQ7FtSuk");
  const result = await resp.text();
  console.log(result, 1111);
}

export default function App() {
  const [src, setSrc] = useState("");

  useEffect(() => {
    test();
  }, []);

  return (
    <>
      hello world
      {src && <img src={src} width="600" />}
      <InterfaceTest />
    </>
  );
}
