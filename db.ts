import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const POOL_CONNECTIONS = 3;

// Database configuration from environment variables
const dbConfig = {
  user: Deno.env.get("DB_USER") || "postgres",
  password: Deno.env.get("DB_PASSWORD") || "postgres",
  database: Deno.env.get("DB_NAME") || "warikan",
  hostname: Deno.env.get("DB_HOST") || "localhost",
  port: parseInt(Deno.env.get("DB_PORT") || "5432"),
};

const pool = new Pool(dbConfig, POOL_CONNECTIONS);

export async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Create sessions table
    await client.queryObject`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create members table
    await client.queryObject`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create expenses table
    await client.queryObject`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        date DATE NOT NULL,
        paid_by_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create expense_participants table (for paid_for_ids)
    await client.queryObject`
      CREATE TABLE IF NOT EXISTS expense_participants (
        expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        member_id INTEGER NOT NULL,
        PRIMARY KEY (expense_id, member_id)
      )
    `;

    // Create index for faster lookups
    await client.queryObject`
      CREATE INDEX IF NOT EXISTS idx_members_session_id ON members(session_id)
    `;
    
    await client.queryObject`
      CREATE INDEX IF NOT EXISTS idx_expenses_session_id ON expenses(session_id)
    `;

    console.log("✅ Database tables initialized");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

export interface SessionData {
  members: Array<{
    id: number;
    name: string;
  }>;
  expenses: Array<{
    id: number;
    description: string;
    amount: number;
    date: string;
    paidById: number;
    paidForIds: number[];
  }>;
  nextMemberId: number;
  nextExpenseId: number;
}

export async function createSession(): Promise<string> {
  const client = await pool.connect();
  
  try {
    const result = await client.queryObject<{ id: string }>`
      INSERT INTO sessions DEFAULT VALUES
      RETURNING id
    `;
    
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

export async function saveSessionData(sessionId: string, data: SessionData): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.queryObject`BEGIN`;

    // Delete existing data for this session
    await client.queryObject`
      DELETE FROM members WHERE session_id = ${sessionId}
    `;
    await client.queryObject`
      DELETE FROM expenses WHERE session_id = ${sessionId}
    `;

    // Insert members
    for (const member of data.members) {
      await client.queryObject`
        INSERT INTO members (id, session_id, name)
        VALUES (${member.id}, ${sessionId}, ${member.name})
      `;
    }

    // Insert expenses and participants
    for (const expense of data.expenses) {
      await client.queryObject`
        INSERT INTO expenses (id, session_id, description, amount, date, paid_by_id)
        VALUES (${expense.id}, ${sessionId}, ${expense.description}, ${expense.amount}, ${expense.date}, ${expense.paidById})
      `;

      for (const participantId of expense.paidForIds) {
        await client.queryObject`
          INSERT INTO expense_participants (expense_id, member_id)
          VALUES (${expense.id}, ${participantId})
        `;
      }
    }

    // Update the session's updated_at timestamp
    await client.queryObject`
      UPDATE sessions
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sessionId}
    `;

    await client.queryObject`COMMIT`;
  } catch (error) {
    await client.queryObject`ROLLBACK`;
    throw error;
  } finally {
    client.release();
  }
}

export async function loadSessionData(sessionId: string): Promise<SessionData | null> {
  const client = await pool.connect();
  
  try {
    // Check if session exists
    const sessionResult = await client.queryObject<{ id: string }>`
      SELECT id FROM sessions WHERE id = ${sessionId}
    `;
    
    if (sessionResult.rows.length === 0) {
      return null;
    }

    // Load members
    const membersResult = await client.queryObject<{ id: number; name: string }>`
      SELECT id, name FROM members
      WHERE session_id = ${sessionId}
      ORDER BY id
    `;

    // Load expenses
    const expensesResult = await client.queryObject<{
      id: number;
      description: string;
      amount: string;
      date: Date;
      paid_by_id: number;
    }>`
      SELECT id, description, amount, date, paid_by_id
      FROM expenses
      WHERE session_id = ${sessionId}
      ORDER BY id
    `;

    const expenses = [];
    for (const expense of expensesResult.rows) {
      // Load participants for this expense
      const participantsResult = await client.queryObject<{ member_id: number }>`
        SELECT member_id FROM expense_participants
        WHERE expense_id = ${expense.id}
        ORDER BY member_id
      `;

      expenses.push({
        id: expense.id,
        description: expense.description,
        amount: parseFloat(expense.amount),
        date: expense.date.toISOString().split("T")[0],
        paidById: expense.paid_by_id,
        paidForIds: participantsResult.rows.map((p) => p.member_id),
      });
    }

    const nextMemberId = membersResult.rows.length > 0
      ? Math.max(...membersResult.rows.map((m) => m.id)) + 1
      : 0;
    
    const nextExpenseId = expenses.length > 0
      ? Math.max(...expenses.map((e) => e.id)) + 1
      : 0;

    return {
      members: membersResult.rows,
      expenses,
      nextMemberId,
      nextExpenseId,
    };
  } finally {
    client.release();
  }
}

export { pool };
