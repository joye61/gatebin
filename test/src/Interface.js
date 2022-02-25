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
export function InterfaceTest() {
  let [file, setFile] = useState(null);
  useEffect(() => {}, []);
  // 接口测试
  async function InterfaceTestFn() {
    const resp = await post(`http://upload-test.chelun.com/upload`, {
      method: "POST",
      // body: {},
      compress: true,
    });

    const result = await resp.json();
    console.log(result, "result");
  }

  // fileUpload
  async function fileUpload() {
    const resp = await post(`https://file.chelun.com/upload`, {
      method: "POST",
      body: file,
      compress: true,
    });

    const result = await resp.json();
    console.log(result, "result");
  }

  // 退出登录
  async function loginOut() {
    const resp = await post(`https://passport.chelun.com/api_v2/logout?os=h5`, {
      method: "POST",
      body: {},
    });
    const result = await resp.json();
    if (result.code == 1) {
      window.localStorage.removeItem("ac_token");
    }
  }

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={loginOut}>退出登录测试</button>
      </div>

      {/* 接口测试 */}
      <div>
        <button onClick={InterfaceTestFn} style={{ marginBottom: "20px" }}>
          接口测试
        </button>
      </div>

      {/* 文件上传 */}

      <input
        name="file"
        type="file"
        onChange={(event) => {
          console.log(event.target.files[0], "event.target.files[0]");
          let data = {
            ftype: 29,
            auth_type: 1,
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

      <button onClick={fileUpload} style={{ marginLeft: "30px" }}>
        文件上传测试
      </button>
    </>
  );
}
