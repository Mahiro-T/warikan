import { define } from "../../../utils.ts";
import { saveSessionData, loadSessionData, type SessionData } from "../../../db.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const sessionId = ctx.params.id;
    
    try {
      const data = await loadSessionData(sessionId);
      
      if (!data) {
        return Response.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      
      return Response.json(data);
    } catch (error) {
      console.error("Error loading session:", error);
      return Response.json(
        { error: "Failed to load session" },
        { status: 500 }
      );
    }
  },

  async POST(ctx) {
    const sessionId = ctx.params.id;
    
    try {
      const data: SessionData = await ctx.req.json();
      await saveSessionData(sessionId, data);
      
      return Response.json({ success: true });
    } catch (error) {
      console.error("Error saving session:", error);
      return Response.json(
        { error: "Failed to save session" },
        { status: 500 }
      );
    }
  },
});
