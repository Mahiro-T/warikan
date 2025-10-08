import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import WarikanApp from "../../islands/WarikanApp.tsx";

export const handler = define.handlers({
  GET(ctx) {
    const sessionId = ctx.params.id;
    return ctx.render({ sessionId });
  },
});

export default define.page<{ sessionId: string }>(function SessionPage(props) {
  const { sessionId } = props.data;

  return (
    <>
      <Head>
        <title>旅行割り勘精算アプリ - セッション</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/style.css" />
      </Head>
      <body class="bg-gray-100 text-gray-800">
        <WarikanApp sessionId={sessionId} />
      </body>
    </>
  );
});
