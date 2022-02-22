import isPlainObject from "lodash/isPlainObject";

export interface GatewayConfig {
  url: string;
}

export const config: GatewayConfig = {
  url: "//bin.chelun.com/do",
};

if (process.env.NODE_ENV !== "production") {
  config.url = "//10.10.33.70:9003/do";
}

/**
 * 更新网关配置
 * @param option
 */
export function updateConfig(option: GatewayConfig) {
  if (isPlainObject(option)) {
    for (let key in option) {
      if (config.hasOwnProperty(key)) {
        config[key as keyof GatewayConfig] = option[key as keyof GatewayConfig];
      }
    }
  }
}
