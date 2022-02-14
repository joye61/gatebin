import { useEffect } from "react";
import post from "@";

export default function App() {
  useEffect(() => {
    post();
  }, []);

  return <>hello world</>;
}
