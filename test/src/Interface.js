import { useEffect, useState } from "react";
import post from "@";

// 文件上传 http://upload-test.chelun.com/upload
// token:
//           "eyJmdHlwZSI6NDAsInVzZXJfaWQiOjEsImFjY2Vzc19rZXkiOiJjaGV6aHUuZWNsaWNrcy5jbjE0NzY5NTUwMjY0NDE2IiwiZGVhZGxpbmUiOjE2NDU2ODQ2MjF9:BlDzl1Kn9Mexf09oIOY0HZMhPxo",
//         ftype: 40,
//         auth_type: 0,
//         file: file,
//         credentials: "include",

// 获取图形验证码
export function InterfaceTest(props) {
  let [file, setFile] = useState(null);

  // 接口测试
  async function InterfaceTestFn() {
    const resp = await post(`http://upload-test.chelun.com/upload`, {
      method: "POST",
      body: file,
      // body: {},
      compress: true,
    });

    const result = await resp.json();
    console.log(result, "result");
  }

  useEffect(() => {}, []);

  return (
    <>
      <input
        type="file"
        onChange={(event) => {
          console.log(event.target.files[0], "event.target.files[0]");
          let data = {
            token:
              "eyJmdHlwZSI6NDAsInVzZXJfaWQiOjEsImFjY2Vzc19rZXkiOiJjaGV6aHUuZWNsaWNrcy5jbjE0NzY5NTUwMjY0NDE2IiwiZGVhZGxpbmUiOjE2NDU3MDA0MjZ9:-s57jy0ZpiXf48QZANvRBwQ4iw0",
            ftype: 40,
            auth_type: 0,
            file: event.target.files[0],
          };

          let body = new FormData();
          for (let key in data) {
            if (data.hasOwnProperty(key)) {
              body.append(key, data[key]);
            }
          }

          setFile(body);
        }}
      ></input>

      <button onClick={InterfaceTestFn} style={{ marginLeft: "30px" }}>
        接口测试
      </button>
    </>
  );
}
