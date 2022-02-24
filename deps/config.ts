import isPlainObject from "lodash/isPlainObject";

export interface GatewayConfig {
  [key: string]: boolean | string | undefined;
  // 是否开启调试模式，默认不开启
  debug?: boolean;
  // 网关入口，如果没有设置会报错
  entry?: string;
  // cache存储的键前缀
  cacheKey?: string;
}

export const config: GatewayConfig = {
  debug: false,
  entry: "",
  cacheKey: "__bin_gateway",
};

/**
 * 更新网关配置
 * @param option
 */
export function GatewayConfig(option: GatewayConfig) {
  if (isPlainObject(option)) {
    for (let key in option) {
      if (config.hasOwnProperty(key)) {
        config[key] = option[key];
      }
    }
  }
}
