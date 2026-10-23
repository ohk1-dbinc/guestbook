// 앱으로 설치할 때 쓰는 정보 (/manifest.webmanifest)
export default function manifest() {
  return {
    name: "송별·축하 방명록",
    short_name: "방명록",
    description: "고마운 마음, 축하하는 마음을 한마디씩 남기는 팀 방명록",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8f6",
    theme_color: "#00854a",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
