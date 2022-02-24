import { useEffect, useState } from "react";
import post from "@";

// async function testFn(props) {}
// 参考大巨会供应商端

// 获取图形验证码  `http://clsp-admin-test.carlink716.com/SupplierAdmin/Login/MakeImageVerify?${Date.now().toString( 16)}`

// 获取验证码  http://clsp-admin-test.carlink716.com/SupplierAdmin/Login/GetVerify?phone=15952171356&image_code=4802
// phone: 15952171356
// image_code: 4802

// 验证码登录  http://clsp-admin-test.carlink716.com/SupplierAdmin/Login/Login
// phone: 15952171356
// verify: 454663

// 退出  http://clsp-admin-test.carlink716.com/SupplierAdmin/Login/LoginOut

// 密码登录  http://mjadmin-test.chelun.com/api/mini/login
// mobile: "15952171111",
// open_id: "o8-IA5PYljga7tGGExoCUUHKt9oo",
// password: "2ae95839277cd8a072901a4339bd35d3",

// 文件上传 http://upload-test.chelun.com/upload
// token:
//           "eyJmdHlwZSI6NDAsInVzZXJfaWQiOjEsImFjY2Vzc19rZXkiOiJjaGV6aHUuZWNsaWNrcy5jbjE0NzY5NTUwMjY0NDE2IiwiZGVhZGxpbmUiOjE2NDU2ODQ2MjF9:BlDzl1Kn9Mexf09oIOY0HZMhPxo",
//         ftype: 40,
//         auth_type: 0,
//         file: file,
//         credentials: "include",

// 获取图形验证码
export function Login() {
  let [src, setSrc] = useState("");
  let [phone, setPhone] = useState(null);
  let [imageVerify, setImageVerify] = useState(null);
  let [verify, setVerify] = useState(null);

  // 获取图形验证码
  async function makeImageVerify() {
    const resp = await post(
      `http://clsp-admin-test.carlink716.com/SupplierAdmin/Login/MakeImageVerify?${Date.now().toString(
        16
      )}`,
      {
        method: "GET",
      }
    );
    // 获取图形验证码 转url
    const result = await resp.blobUrl();
    setSrc(result);
    console.log(result, "result");
  }
  // 获取短信验证码
  async function getVerify() {
    const resp = await post(
      `http://clsp-admin-test.carlink716.com/SupplierAdmin/Login/GetVerify?phone=${phone}&image_code=${imageVerify}`,
      {
        method: "GET",
        body: {
          // phone: phone,
          // image_code: imageVerify,
        },
      }
    );

    const result = await resp.json();
    console.log(result, "result");
  }
  // 验证码登录
  async function login() {
    const resp = await post(
      `http://clsp-admin-test.carlink716.com/SupplierAdmin/Login/Login`,
      {
        method: "POST",
        body: {
          phone: phone,
          verify: verify,
          // mobile: "15952171111",
          // open_id: "o8-IA5PYljga7tGGExoCUUHKt9oo",
          // password: "2ae95839277cd8a072901a4339bd35d3",
        },
        credentials: "include",
      }
    );
    const result = await resp.json();
    console.log(result, "result");
  }

  // 退出登录
  async function loginOut() {
    const resp = await post(
      `http://clsp-admin-test.carlink716.com/SupplierAdmin/Login/LoginOut`,
      {
        method: "POST",
        body: {},
      }
    );
    const result = await resp.json();
    console.log(result, "result");
  }

  useEffect(() => {}, []);

  return (
    <>
      <div style={{ marginTop: "30px" }}>
        <button onClick={makeImageVerify}>获取图形验证码</button>
        <img src={src}></img>
      </div>

      <div style={{ marginTop: "30px" }}>
        手机号
        <input
          onChange={(e) => {
            setPhone(e.target.value);
          }}
        ></input>
        图形验证码
        <input
          onChange={(e) => {
            setImageVerify(e.target.value);
          }}
        ></input>
        <button onClick={getVerify} style={{ marginLeft: "30px" }}>
          获取短信验证码
        </button>
      </div>
      <div>
        手机号
        <input
          onChange={(e) => {
            setPhone(e.target.value);
          }}
        ></input>
        短信验证码
        <input
          onChange={(e) => {
            setVerify(e.target.value);
          }}
        ></input>
        <button onClick={login} style={{ marginLeft: "30px" }}>
          登录测试
        </button>
      </div>
      <div style={{ marginTop: "30px" }}>
        <button onClick={loginOut}>退出登录测试</button>
      </div>
    </>
  );
}
