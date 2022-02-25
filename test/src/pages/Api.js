import send from "@";
import { useEffect } from "react";

export function Api() {
  useEffect(() => {
    // const params = new URLSearchParams();
    // params.append("a", 1);
    // params.append("b", "hello world");

    // send("https://www.baidu.com", {
    //   body: {
    //     a: 1,
    //     b: "word",
    //     c: new File([new Blob([1])], "test.data"),
    //   },
    // });
    send(
      `https://passport.chelun.com/api_v2/get_sms_captcha?os=h5`,
      {
        method: "POST",
        body: {
          phone: 13482228079,
        },
      }
    );
  }, []);

  return <>Api</>;
}
