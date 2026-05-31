/**
 * Team Authentication — Email + Password with Invite Codes
 * 
 * - Team members register via invite links with pre-assigned roles (multi-role)
 * - Login via email + password → JWT session cookie (same cookie as OAuth)
 * - Manus OAuth remains the super_admin login path
 * - Admins/super_admins can create and manage invite codes
 * - Password reset via token-based email flow
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users, inviteCodes, userRoles, passwordResetTokens } from "../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./gmailService";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const MANAGEMENT_ROLES = ["super_admin", "admin", "management", "case_manager", "tech_compliance", "marketing", "finance"] as const;
const ALL_ROLES = ["user", "admin", "gestor", "super_admin", "management", "case_manager", "tech_compliance", "marketing", "finance", "translator", "read_only_advisor", "ai_system"] as const;

function requireDb() {
  return getDb().then(db => {
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db;
  });
}

/**
 * Get all roles for a user (from user_roles junction table + fallback to users.role)
 */
export async function getUserRoles(userId: number): Promise<string[]> {
  const db = await requireDb();
  const roleRows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId));
  
  if (roleRows.length > 0) {
    return roleRows.map((r: { role: string }) => r.role);
  }
  
  // Fallback: use the single role from users table (backwards compat)
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  return user ? [user.role] : [];
}

/**
 * Sync roles to user_roles table (called when assigning multi-roles)
 */
async function syncUserRoles(userId: number, roles: string[], assignedById?: number): Promise<void> {
  const db = await requireDb();
  
  // Delete existing roles
  await db.delete(userRoles).where(eq(userRoles.userId, userId));
  
  // Insert new roles
  if (roles.length > 0) {
    await db.insert(userRoles).values(
      roles.map(role => ({
        userId,
        role: role as any,
        assignedById: assignedById || null,
      }))
    );
    
    // Also update the primary role in users table (use first role as primary)
    await db.update(users).set({ role: roles[0] as any }).where(eq(users.id, userId));
  }
}

export const teamAuthRouter = router({
  /**
   * Team Login — email + password → session cookie
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      
      const [user] = await db.select().from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      
      if (!user || !user.passwordHash) {
        // Dummy bcrypt compare to prevent timing-based user enumeration
        await bcrypt.compare(input.password, "$2a$12$000000000000000000000000000000000000000000000000000000");
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      
      // Update last signed in
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      
      // Create JWT session (same format as OAuth flow)
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      
      // Get all roles for this user
      const roles = await getUserRoles(user.id);
      
      return { 
        success: true, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role, roles } 
      };
    }),

  /**
   * Register via invite code — creates account with pre-assigned role(s)
   */
  register: publicProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1).max(255),
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      
      // Validate invite code
      const [invite] = await db.select().from(inviteCodes)
        .where(and(
          eq(inviteCodes.code, input.code),
          eq(inviteCodes.status, "active"),
        ))
        .limit(1);
      
      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired invite code" });
      }
      
      // Check expiry
      if (invite.expiresAt < new Date()) {
        await db.update(inviteCodes).set({ status: "expired" }).where(eq(inviteCodes.id, invite.id));
        throw new TRPCError({ code: "NOT_FOUND", message: "This invite code has expired" });
      }
      
      // Check if email is restricted to specific address
      if (invite.email && invite.email.toLowerCase() !== input.email.toLowerCase()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This invite is for a different email address" });
      }
      
      // Check if email already exists
      const [existing] = await db.select().from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 12);
      
      // Create user with a unique openId (team-{random})
      const openId = `team-${crypto.randomUUID()}`;
      
      // Determine all roles to assign: use the roles JSON array if available, otherwise fall back to single role field
      const rolesToAssign: string[] = (invite.roles && Array.isArray(invite.roles) && invite.roles.length > 0)
        ? invite.roles as string[]
        : [invite.role];
      
      // Use the first role as the primary role in the users table
      const primaryRole = rolesToAssign[0];
      
      await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        passwordHash,
        role: primaryRole as any,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });
      
      // Get the created user
      const [newUser] = await db.select().from(users)
        .where(eq(users.openId, openId))
        .limit(1);
      
      // Insert all roles into the user_roles junction table
      await db.insert(userRoles).values(
        rolesToAssign.map(r => ({
          userId: newUser.id,
          role: r as any,
          assignedById: invite.createdById,
        }))
      );
      
      // Mark invite as used
      await db.update(inviteCodes).set({
        status: "used",
        usedById: newUser.id,
        usedAt: new Date(),
      }).where(eq(inviteCodes.id, invite.id));
      
      // Create session
      const sessionToken = await sdk.createSessionToken(openId, {
        name: input.name,
        expiresInMs: ONE_YEAR_MS,
      });
      
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      
      return { 
        success: true, 
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: primaryRole, roles: rolesToAssign } 
      };
    }),

  /**
   * Validate an invite code (used on the /join page to show role info)
   */
  validateInvite: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await requireDb();
      
      const [invite] = await db.select().from(inviteCodes)
        .where(and(
          eq(inviteCodes.code, input.code),
          eq(inviteCodes.status, "active"),
        ))
        .limit(1);
      
      if (!invite || invite.expiresAt < new Date()) {
        return { valid: false, role: null, roles: null, email: null };
      }
      
      // Return the full roles array if available, otherwise wrap the single role
      const roles = (invite.roles && Array.isArray(invite.roles) && invite.roles.length > 0)
        ? invite.roles as string[]
        : [invite.role];
      
      return { valid: true, role: invite.role, roles, email: invite.email };
    }),

  /**
   * Create invite code with multiple roles (admin/super_admin only)
   */
  createInvite: protectedProcedure
    .input(z.object({
      email: z.string().email().optional(),
      roles: z.array(z.enum(ALL_ROLES)).min(1, "At least one role is required"),
      expiresInDays: z.number().min(1).max(90).default(7),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only admins and super_admins can create invites
      const INVITE_CREATORS = ['admin', 'super_admin'];
      const callerRoles = await getUserRoles(ctx.user.id);
      const hasPermission = callerRoles.some((r: string) => INVITE_CREATORS.includes(r));
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admin or super_admin can create invites" });
      }
      
      // Prevent privilege escalation: only super_admin can grant super_admin
      const callerIsSuperAdmin = callerRoles.includes('super_admin');
      if (input.roles.includes('super_admin') && !callerIsSuperAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can grant super_admin role" });
      }
      
      const db = await requireDb();
      const code = crypto.randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);
      
      // Store primary role in invite (first role) + full roles array in JSON column
      await db.insert(inviteCodes).values({
        code,
        email: input.email || null,
        role: input.roles[0],
        roles: input.roles as string[],
        createdById: ctx.user.id,
        expiresAt,
      });
      
      return { code, expiresAt, roles: input.roles, email: input.email || null };
    }),

  /**
   * List all invite codes (admin/super_admin only)
   */
  listInvites: protectedProcedure
    .query(async ({ ctx }) => {
      const callerRoles = await getUserRoles(ctx.user.id);
      const hasPermission = callerRoles.some((r: string) => MANAGEMENT_ROLES.includes(r as any));
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only management team can view invites" });
      }
      
      const db = await requireDb();
      const invites = await db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
      return invites;
    }),

  /**
   * Revoke an invite code
   */
  revokeInvite: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const callerRoles = await getUserRoles(ctx.user.id);
      const hasPermission = callerRoles.some((r: string) => MANAGEMENT_ROLES.includes(r as any));
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only management team can revoke invites" });
      }
      
      const db = await requireDb();
      await db.update(inviteCodes).set({ status: "revoked" }).where(eq(inviteCodes.id, input.id));
      return { success: true };
    }),

  /**
   * List team members with their roles (admin/super_admin only)
   */
  listTeam: protectedProcedure
    .query(async ({ ctx }) => {
      const callerRoles = await getUserRoles(ctx.user.id);
      const hasPermission = callerRoles.some((r: string) => MANAGEMENT_ROLES.includes(r as any));
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only management team can view team members" });
      }
      
      const db = await requireDb();
      const team = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        loginMethod: users.loginMethod,
        lastSignedIn: users.lastSignedIn,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt));
      
      // Fetch all user_roles for team members
      const allUserRoles = await db.select().from(userRoles);
      const rolesByUser = new Map<number, string[]>();
      for (const ur of allUserRoles) {
        const existing = rolesByUser.get(ur.userId) || [];
        existing.push(ur.role);
        rolesByUser.set(ur.userId, existing);
      }
      
      return team.map(member => ({
        ...member,
        roles: rolesByUser.get(member.id) || [member.role],
      }));
    }),

  /**
   * Update a team member's roles (super_admin only) — supports multi-role
   */
  updateRoles: protectedProcedure
    .input(z.object({
      userId: z.number(),
      roles: z.array(z.enum(ALL_ROLES)).min(1, "At least one role is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can change roles" });
      }
      
      await syncUserRoles(input.userId, input.roles, ctx.user.id);
      return { success: true };
    }),

  /**
   * Get roles for current user
   */
  getMyRoles: protectedProcedure
    .query(async ({ ctx }) => {
      const roles = await getUserRoles(ctx.user.id);
      return { roles };
    }),

  /**
   * Remove a team member (super_admin only, cannot remove self)
   */
  removeMember: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can remove members" });
      }
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove yourself" });
      }
      
      const db = await requireDb();
      // Remove all roles
      await db.delete(userRoles).where(eq(userRoles.userId, input.userId));
      // Set role to 'user' (soft disable — keeps record for audit)
      await db.update(users).set({ role: "user" }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ============================================================
  // PASSWORD RESET
  // ============================================================

  /**
   * Request password reset — generates token and sends email notification
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      
      // Find user by email
      const [user] = await db.select().from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      
      // Always return success (don't reveal if email exists)
      if (!user || !user.passwordHash) {
        return { success: true, message: "If an account exists with that email, a reset link has been sent." };
      }
      
      // Generate token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Store token
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });
      
      // Send password reset link directly to the user
      const resetUrl = `${process.env.VITE_APP_URL || "https://spainporfavor.com"}/reset-password/${token}`;
      
      try {
        await sendEmail({
          to: user.email!,
          subject: "Password Reset \u2014 SpainPorFavor Team Portal",
          body: `Hi ${user.name || "there"},\n\nYou requested a password reset for your SpainPorFavor team account.\n\nClick here to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest,\nSpainPorFavor Team`,
          category: "client",
        });
      } catch (err) {
        console.error("[PasswordReset] Failed to send reset email:", err);
        // Fallback: notify owner if direct email fails
        try {
          await notifyOwner({
            title: `Password Reset Request: ${user.email}`,
            content: `Team member ${user.name || user.email} requested a password reset but direct email failed.\n\nReset link (valid 1 hour): ${resetUrl}\n\nPlease forward this link to them securely.`,
          });
        } catch (_) {}
      }
      
      return { 
        success: true, 
        message: "If an account exists with that email, a reset link has been sent." 
      };
    }),

  /**
   * Validate a password reset token
   */
  validateResetToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await requireDb();
      
      const [resetRecord] = await db.select().from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, input.token))
        .limit(1);
      
      if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
        return { valid: false, email: null };
      }
      
      // Get user email for display
      const [user] = await db.select({ email: users.email }).from(users)
        .where(eq(users.id, resetRecord.userId))
        .limit(1);
      
      return { valid: true, email: user?.email || null };
    }),

  /**
   * Reset password using token
   */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      
      const [resetRecord] = await db.select().from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, input.token))
        .limit(1);
      
      if (!resetRecord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid reset token" });
      }
      
      if (resetRecord.usedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link has already been used" });
      }
      
      if (resetRecord.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link has expired" });
      }
      
      // Hash new password
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      
      // Update user password
      await db.update(users).set({ passwordHash }).where(eq(users.id, resetRecord.userId));
      
      // Mark token as used
      await db.update(passwordResetTokens).set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetRecord.id));
      
      return { success: true, message: "Password has been reset. You can now log in with your new password." };
    }),
});
