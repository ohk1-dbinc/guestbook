import "./globals.css";

export const metadata = {
  title: "송별·축하 방명록",
  description: "고마운 마음, 축하하는 마음을 한마디씩 남기는 팀 방명록",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
