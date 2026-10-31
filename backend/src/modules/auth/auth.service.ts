import { db } from '../../db/index.js';
import { users, userDepartments, departments } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';

export async function loginUser(username: string, passwordPlain: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);

  if (!user) {
    throw { status: 401, message: 'Invalid username or password' };
  }

  if (!user.isActive) {
    throw { status: 403, message: 'This account has been deactivated. Contact an administrator.' };
  }

  const isMatch = await comparePassword(passwordPlain, user.passwordHash);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid username or password' };
  }

  // Get assigned departments
  const assignedDepts = await db
    .select({
      id: departments.id,
      name: departments.name,
      slug: departments.slug,
      color: departments.accentColor,
    })
    .from(userDepartments)
    .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
    .where(eq(userDepartments.userId, user.id));

  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      assignedDepartments: assignedDepts.map((d) => d.id),
      departmentDetails: assignedDepts,
    },
  };
}

export async function getCurrentUserProfile(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  if (!user.isActive) {
    throw { status: 403, message: 'Your account has been deactivated' };
  }

  const assignedDepts = await db
    .select({
      id: departments.id,
      name: departments.name,
      slug: departments.slug,
      color: departments.accentColor,
    })
    .from(userDepartments)
    .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
    .where(eq(userDepartments.userId, user.id));

  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    assignedDepartments: assignedDepts.map((d) => d.id),
    departmentDetails: assignedDepts,
  };
}

export async function changeUserPassword(userId: string, currentPass: string, newPass: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  const isMatch = await comparePassword(currentPass, user.passwordHash);
  if (!isMatch) {
    throw { status: 400, message: 'Current password does not match' };
  }

  const newHash = await hashPassword(newPass);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { success: true };
}

