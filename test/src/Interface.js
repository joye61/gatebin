import { useEffect, useState } from "react";
import post from "@";
import { set } from "lodash";

// async function InterfaceTest() {
//   const resp = await post("https://map.baidu.com/search");
//   const result = await resp.blobUrl();
//   console.log(result, 1111);
// }

export function InterfaceTest() {
  const [src, setSrc] = useState("");

  useEffect(() => {
    (async () => {
      const resp = await post(
        "https://cljkt-h5.chelun.com/2021/dypush/indexNewCopyMultipleKs.html",
        {
          body: {
            cs: "jkt_ksh5_tg01",
          },
        }
      );
      const result = await resp.text();
      console.log(result, "result");
      if (result) {
        set(result);
      }
    })();
  }, []);

  return (
    <>
      hello world
      <a href={src}></a>
    </>
  );
}
