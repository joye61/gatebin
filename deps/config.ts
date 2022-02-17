export interface Config {
  gatewayUrl: string;
  encryption: boolean;
  encryptKey: string;
}

export const config: Config = {
  // 网关地址
  get gatewayUrl(): string {
    let url = "//bin.chelun.com/do";
    if (process.env.NODE_ENV !== "production") {
      url = "//10.10.29.70:5000/do";
    }
    return url;
  },
  // 是否加密
  encryption: process.env.NODE_ENV === "production",
  // 加密秘钥
  encryptKey: "7-Gd.*u(y@Y&$*&#"
};
