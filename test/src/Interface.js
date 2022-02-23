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
        "https://mj.chelun.com/api/mini/order/list/init",
        {
          body: {
            pageNo: 1,
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
      Interface
      <a href={src} link={src}></a>
    </>
  );
}
