import { useEffect, useState } from "react";
import post from "@";

// async function testFn(props) {}

export function InterfaceTest(props) {
  console.log(props, "props");

  useEffect(() => {
    (async () => {
      const resp = await post(props.params.url, {
        method: props.params.method || "GET",
        body: props.params.body,
      });
      const result = await resp.json();
      console.log(result, "result");
    })();
  }, []);

  return <>Interface</>;
}
