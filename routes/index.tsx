import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import WarikanApp from "../islands/WarikanApp.tsx";

export default define.page(function Home() {
  return (
    <>
      <Head>
        <title>旅行割り勘精算アプリ</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/style.css" />
      </Head>
      <body class="bg-gray-100 text-gray-800">
        <WarikanApp />
      </body>
    </>
  );
});
