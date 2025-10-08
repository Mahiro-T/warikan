import { define } from "../../utils.ts";
import { createSession } from "../../db.ts";

export const handler = define.handlers({
  async POST() {
    try {
      const sessionId = await createSession();
      return Response.json({ sessionId });
    } catch (error) {
      console.error("Error creating session:", error);
      return Response.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }
  },
});
