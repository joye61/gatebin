export interface Config {
  gatewayUrl: string;
}

export const config: Config = {
  // 网关地址
  get gatewayUrl(): string {
    let url = "//bin.chelun.com/do";
    if (process.env.NODE_ENV !== "production") {
      url = "//10.10.33.70:9003/do";
    }
    // //10.10.29.70:5000/do
    return url;
  }
};
