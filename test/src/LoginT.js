import { useEffect, useState } from "react";
import post from "@";
import { setTextRange } from "typescript";

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
export function LoginT() {
  let [src, setSrc] = useState("");
  let [phone, setPhone] = useState(null);
  let [imageVerify, setImageVerify] = useState(null);
  let [ImageVerifyData, setImageVerifyData] = useState(null);

  let [verify, setVerify] = useState(null);
  let [text, setText] = useState(null);

  // 获取短信验证码
  async function getVerify() {
    const resp = await post(
      `https://passport-test.chelun.com/api_v2/get_sms_captcha?os=h5`,
      {
        method: "POST",
        body: {
          phone: phone,
          // image_code: imageVerify,
        },
      }
    );

    const result = await resp.json();
    if (result.code === 15001) {
      // let data = result.data;
      setImageVerifyData(result.data);
      const res = await post(result.data.captcha_url);
      let url = await res.blobUrl();
      console.log(url);
      setSrc(url);
    }
  }

  // 图形验证码保存
  async function imageVerifySave() {
    const resp = await post(
      `https://passport-test.chelun.com/api_v2/get_sms_captcha?os=h5`,
      {
        method: "POST",
        body: {
          phone: phone,
          verify_code: imageVerify,
          api_ticket: ImageVerifyData.api_ticket,
        },
      }
    );
    let result = await resp.json();
    if (result.code == 1) {
      setText("已发送");
    } else {
      setText(result.msg);
    }
    console.log(result, "短信验证码");
  }

  // 验证码登录
  async function login() {
    const resp = await post(
      `https://passport-test.chelun.com/api_v2/login_with_captcha?os=h5`,
      {
        method: "POST",
        body: {
          phone: phone,
          captcha: verify,
        },
      }
    );
    const result = await resp.json();
    if (result.code == 1) {
      window.localStorage.setItem("ac_token", JSON.stringify(result.data));
    }

    console.log(result, "result");
  }

  useEffect(() => {}, []);

  return (
    <>
      <div style={{ marginTop: "10px" }}>
        手机号
        <input
          onChange={(e) => {
            setPhone(e.target.value);
          }}
        ></input>
        <button onClick={getVerify} style={{ marginLeft: "10px" }}>
          获取短信验证码
        </button>
        <img src={src} style={{ marginLeft: "10px" }} width={100}></img>
      </div>
      <div style={{ marginTop: "10px" }}>
        {src && (
          <>
            图形验证码
            <input
              onChange={(e) => {
                setImageVerify(e.target.value);
              }}
            ></input>
            <button
              onClick={async () => {
                const res = await post(ImageVerifyData.captcha_url);
                let url = await res.blobUrl();
                setSrc(url);
              }}
              style={{ marginLeft: "10px" }}
            >
              更换
            </button>
            <button onClick={imageVerifySave} style={{ marginLeft: "10px" }}>
              确定
            </button>
            <span>{text}</span>
          </>
        )}
      </div>

      <div style={{ marginTop: "10px" }}>
        短信验证码
        <input
          onChange={(e) => {
            setVerify(e.target.value);
          }}
        ></input>
        <button onClick={login} style={{ marginLeft: "10px" }}>
          登录测试
        </button>
      </div>
    </>
  );
}
