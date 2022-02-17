import { useEffect } from "react";
import post from "@";

export default function App() {
  useEffect(() => {
    post("https://www.chelun.com", {
      method: "POST",
      // headers: {
      //   "content-type": "application/json",
      // },
      body: {
        a: 1,
        b: "hello world 你好世界",
        c: true,
        d: undefined,
        e: null,
        f: 1.92,
      },
    });
  }, []);

  return <>hello world</>;
}
