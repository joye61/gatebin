import send from "@";
import { useEffect } from "react";

export function Api() {
  useEffect(() => {
    // const params = new URLSearchParams();
    // params.append("a", 1);
    // params.append("b", "hello world");

    send("https://www.baidu.com", {
      body: {
        a: 1,
        b: "word",
        c: new File([new Blob([1])], "test.data"),
      },
    });
  }, []);

  return <>Api</>;
}
