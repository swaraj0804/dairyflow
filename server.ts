import express from "express";
import cors from "cors";
import path from "path";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import {
  users,
  customers,
  dailyFinance,
  milkInward,
  expenses,
} from "./src/db/schema.ts";
import { eq, and, notInArray, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { GoogleGenAI, Type } from "@google/genai";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret-jwt-key-replace-me";

const app = express();
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API Routes

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/scan-receipt", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Strip prefix if exists
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
          {
            text: "Extract the milk receipt details from this image. Extract totalQuantity (liters or kg), avgFat, avgSnf, and totalAmount (cost/price/revenue). If a value is missing, return 0.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalQuantity: { type: Type.NUMBER },
            avgFat: { type: Type.NUMBER },
            avgSnf: { type: Type.NUMBER },
            totalAmount: { type: Type.NUMBER },
          },
          required: ["totalQuantity", "avgFat", "avgSnf", "totalAmount"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error) {
    console.error("OCR Error:", error);
    res.status(500).json({ error: "Failed to process receipt" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name, farmName, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = Math.random().toString(36).substring(2, 15);

    const [newUser] = await db
      .insert(users)
      .values({
        uid,
        email,
        password: hashedPassword,
        name: name || "Farmer",
        farmName: farmName || "My Dairy Farm",
        phone: phone || "",
      })
      .returning();

    const token = jwt.sign(
      { uid: newUser.uid, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "30d" },
    );
    res.json({ status: "success", token, user: newUser });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await db.select().from(users).where(eq(users.email, email));
    if (user.length === 0) {
      return res.status(401).json({ error: "Account not found" });
    }

    const valid = await bcrypt.compare(password, user[0].password || "");
    if (!valid) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const token = jwt.sign(
      { uid: user[0].uid, email: user[0].email },
      JWT_SECRET,
      { expiresIn: "30d" },
    );
    res.json({ status: "success", token, user: user[0] });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Failed to authenticate user" });
  }
});

app.get("/api/user/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const data = await db.select().from(users).where(eq(users.uid, uid));
    res.json(data[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.put("/api/auth/password", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new passwords are required" });
    }

    const user = await db.select().from(users).where(eq(users.uid, uid));
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, user[0].password || "");
    if (!valid) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.uid, uid));

    res.json({ status: "success" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
});

app.put("/api/user/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { name, farmName, email, phone } = req.body;

    const data = await db
      .update(users)
      .set({ name, farmName, email, phone })
      .where(eq(users.uid, uid))
      .returning();

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Customers
app.get("/api/customers", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, req.user!.uid));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

app.post("/api/customers", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await db
      .insert(customers)
      .values({ ...req.body, userId: req.user!.uid })
      .returning();
    res.json(data[0]);
  } catch (error) {
    console.error("Failed to add customer:", error);
    res.status(500).json({ error: "Failed to add customer" });
  }
});

app.put("/api/customers/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await db
      .update(customers)
      .set(req.body)
      .where(
        and(
          eq(customers.id, req.params.id as string),
          eq(customers.userId, req.user!.uid),
        ),
      )
      .returning();
    res.json(data[0]);
  } catch (error) {
    console.error("Failed to update customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

app.delete("/api/customers/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    await db
      .delete(dailyFinance)
      .where(eq(dailyFinance.customerId, req.params.id as string));
    await db
      .delete(customers)
      .where(
        and(
          eq(customers.id, req.params.id as string),
          eq(customers.userId, req.user!.uid),
        ),
      );
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete customer:", error);
    res.status(500).json({
      error: "Failed to delete customer",
      details: error?.message || String(error),
    });
  }
});

// Daily Finance
app.get("/api/daily-finance", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await db
      .select()
      .from(dailyFinance)
      .where(eq(dailyFinance.userId, req.user!.uid));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch daily finance" });
  }
});

app.post(
  "/api/daily-finance/bulk",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const { entries: requestedEntries, date } = req.body;
      if (typeof date !== "string" || !Array.isArray(requestedEntries)) {
        return res
          .status(400)
          .json({ error: "A date and entries array are required" });
      }

      const userId = req.user!.uid;
      const entriesByCustomer = new Map<string, any>();
      requestedEntries.forEach((entry: any) =>
        entriesByCustomer.set(entry.customerId, entry),
      );

      await db.transaction(async (tx) => {
        const existingEntries = await tx
          .select({ id: dailyFinance.id, customerId: dailyFinance.customerId })
          .from(dailyFinance)
          .where(
            and(eq(dailyFinance.date, date), eq(dailyFinance.userId, userId)),
          );
        const idByCustomer = new Map<string, string>();
        existingEntries.forEach((entry) => {
          if (!idByCustomer.has(entry.customerId))
            idByCustomer.set(entry.customerId, entry.id);
        });
        const entriesWithUser = Array.from(
          entriesByCustomer.values(),
          (entry: any) => ({
            ...entry,
            id: idByCustomer.get(entry.customerId) || entry.id,
            date,
            userId,
          }),
        );

        if (entriesWithUser.length > 0) {
          const savedEntries = await tx
            .insert(dailyFinance)
            .values(entriesWithUser)
            .onConflictDoUpdate({
              target: dailyFinance.id,
              setWhere: eq(dailyFinance.userId, userId),
              set: {
                amount: sql`excluded.amount`,
                confirmed: sql`excluded.confirmed`,
              },
            })
            .returning({ id: dailyFinance.id });

          if (savedEntries.length !== entriesWithUser.length) {
            throw new Error("Could not update all daily finance entries");
          }

          await tx.delete(dailyFinance).where(
            and(
              eq(dailyFinance.date, date),
              eq(dailyFinance.userId, userId),
              notInArray(
                dailyFinance.id,
                entriesWithUser.map((entry) => entry.id),
              ),
            ),
          );

          for (const entry of entriesWithUser) {
            await tx
              .update(customers)
              .set({ litres: entry.amount })
              .where(eq(customers.id, entry.customerId));
          }
        } else {
          await tx
            .delete(dailyFinance)
            .where(
              and(eq(dailyFinance.date, date), eq(dailyFinance.userId, userId)),
            );
        }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update daily finance" });
    }
  },
);

// Milk Inward
app.get("/api/milk-inward", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await db
      .select()
      .from(milkInward)
      .where(eq(milkInward.userId, req.user!.uid));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch milk inward" });
  }
});

app.post("/api/milk-inward", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await db
      .insert(milkInward)
      .values({ ...req.body, userId: req.user!.uid })
      .returning();
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to add milk inward" });
  }
});

app.put("/api/milk-inward/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await db
      .update(milkInward)
      .set(req.body)
      .where(
        and(
          eq(milkInward.id, req.params.id as string),
          eq(milkInward.userId, req.user!.uid),
        ),
      )
      .returning();
    if (data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update milk inward" });
  }
});

app.delete(
  "/api/milk-inward/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      await db
        .delete(milkInward)
        .where(
          and(
            eq(milkInward.id, req.params.id as string),
            eq(milkInward.userId, req.user!.uid),
          ),
        );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete milk inward" });
    }
  },
);

// Expenses
app.get("/api/expenses", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, req.user!.uid));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

app.post("/api/expenses", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await db
      .insert(expenses)
      .values({ ...req.body, userId: req.user!.uid })
      .returning();
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to add expense" });
  }
});

app.put("/api/expenses/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const data = await db
      .update(expenses)
      .set(req.body)
      .where(and(eq(expenses.id, id), eq(expenses.userId, req.user!.uid)))
      .returning();
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update expense" });
  }
});

app.delete("/api/expenses/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, req.user!.uid)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

// Process crash guards to keep the server alive
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection caught in server process:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception caught in server process:", err);
});

// Global API error handler for express
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Unhandled API Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || "Internal server error" });
    }
  },
);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      "/assets",
      express.static(path.join(distPath, "assets"), {
        maxAge: "1y",
        immutable: true,
      }),
    );
    app.use(express.static(distPath, { maxAge: "1h" }));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
