import { useState, useRef } from "react";
import send from "@";

export function Login() {
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [icode, setIcode] = useState("");
  const [icodeUrl, setiCodeUrl] = useState("");

  const ticketRef = useRef("");

  return (
    <div>
      <div>
        验证码
        <input
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
          }}
        />
        <button
          onClick={async () => {
            const res = await send(
              "https://passport-test.chelun.com/api_v2/get_sms_captcha?os=h5",
              {
                method: "POST",
                body: {
                  phone: 13482228079,
                },
              }
            );
            const data = await res.json();
            if (data.code === 15001) {
              ticketRef.current = data.data.api_ticket;
              const imgUrlRes = await send(data.data.captcha_url);
              const imgValue = await imgUrlRes.blobUrl();
              setiCodeUrl(imgValue);
            }
          }}
        >
          获取验证码
        </button>
        <button
          onClick={async () => {
            const res = await send(
              "https://passport-test.chelun.com/api_v2/get_sms_captcha?os=h5",
              {
                method: "POST",
                body: {
                  phone: 13482228079,
                  verify_code: icode,
                  api_ticket: ticketRef.current,
                },
              }
            );
            const data = await res.json();
          }}
        >
          带图形验证码获取验证码
        </button>
      </div>
      <div>
        <input
          value={icode}
          onChange={(event) => {
            setIcode(event.target.value);
          }}
        />
        <br />
        {icodeUrl && <img src={icodeUrl} alt="" />}
      </div>
      <div>
        <button>登录</button>
      </div>
    </div>
  );
}
