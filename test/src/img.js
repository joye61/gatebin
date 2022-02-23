async function viewImg() {
  const resp = await post("https://map.baidu.com/search");
  const result = await resp.blobUrl();
  console.log(result, 1111);
}

export default function App() {
  const [src, setSrc] = useState("");

  useEffect(() => {
    (async () => {
      const resp = await post(
        "https://www.chelun.com/_next/static/css/0bfb61fb670cefde6350.css"
      );
      const result = await resp.blobUrl();
      setSrc(result);
      setTimeout(() => {
        // resp.download()
      }, 3000);
    })();
  }, []);

  return (
    <>
      hello world
      {src && <img src={src} width="600" />}
      <button
        onClick={() => {
          test();
        }}
      >
        获取图片
      </button>
    </>
  );
}
