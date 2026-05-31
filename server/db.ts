import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, leads } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      // Owner should always be super_admin — do NOT downgrade on OAuth re-login
      values.role = 'super_admin';
      // Do NOT include role in updateSet for owner — preserve existing role if already set
      // This prevents overwriting super_admin back to admin on every login
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Lead capture for exit-intent, quiz, and free-assessment forms
export async function captureLead(data: {
  email: string;
  source: string;
  nationality: string | null;
  visaType: string | null;
  name?: string | null;
  phone?: string | null;
  whatsappOptIn?: number;
  whatsappConsentAt?: Date | null;
  whatsappConsentText?: string | null;
  situation?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot capture lead: database not available");
    return;
  }

  try {
    // Dedupe: check if this email+source combination already exists
    const existing = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.email, data.email), eq(leads.source, data.source)))
      .limit(1);

    if (existing.length > 0) {
      // Update existing lead with any new data
      await db.update(leads)
        .set({
          nationality: data.nationality || undefined,
          visaType: data.visaType || undefined,
          name: data.name || undefined,
          phone: data.phone || undefined,
          whatsappOptIn: data.whatsappOptIn ?? undefined,
          whatsappConsentAt: data.whatsappConsentAt || undefined,
          whatsappConsentText: data.whatsappConsentText || undefined,
          situation: data.situation || undefined,
        })
        .where(eq(leads.id, existing[0].id));
      console.log(`[Lead] Updated existing: ${data.email} (${data.source})`);
    } else {
      await db.insert(leads).values({
        email: data.email,
        source: data.source,
        nationality: data.nationality,
        visaType: data.visaType,
        name: data.name || null,
        phone: data.phone || null,
        whatsappOptIn: data.whatsappOptIn ?? 0,
        whatsappConsentAt: data.whatsappConsentAt || null,
        whatsappConsentText: data.whatsappConsentText || null,
        situation: data.situation || null,
      });
      console.log(`[Lead] Captured: ${data.email} (${data.source})${data.whatsappOptIn ? ' [WhatsApp opted in]' : ''}`);
    }
  } catch (error) {
    console.error("[Database] Failed to capture lead:", error);
    throw error;
  }
}
