import { db } from './index.js';
import { users, departments, userDepartments } from './schema.js';
import { hashPassword } from '../utils/password.js';
import { eq, and } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seed (Clean Production Baseline)...');

  // 1. Seed / Ensure 3 Primary Departments
  console.log('🏢 Seeding departments...');
  const initialDepartments = [
    {
      name: 'Software',
      slug: 'software',
      description: 'Frontend, backend, mobile application development and infrastructure.',
      accentColor: '#3B82F6',
      isActive: true,
    },
    {
      name: 'Video Editor',
      slug: 'video-editor',
      description: 'Video production, motion graphics, promotional assets, and reels.',
      accentColor: '#8B5CF6',
      isActive: true,
    },
    {
      name: 'Digital Marketing',
      slug: 'digital-marketing',
      description: 'Search engine optimization, social ad campaigns, lead generation, and growth.',
      accentColor: '#10B981',
      isActive: true,
    },
  ];

  const deptMap = new Map<string, string>(); // slug -> id

  for (const dept of initialDepartments) {
    const existing = await db
      .select()
      .from(departments)
      .where(eq(departments.slug, dept.slug))
      .limit(1);

    if (existing.length === 0) {
      const [inserted] = await db.insert(departments).values(dept).returning();
      deptMap.set(dept.slug, inserted.id);
      console.log(`  + Created department: ${dept.name}`);
    } else {
      deptMap.set(dept.slug, existing[0].id);
      console.log(`  = Existing department: ${dept.name}`);
    }
  }

  // 2. Seed / Ensure Admin Account (Chandu)
  console.log('👤 Seeding admin account...');
  const adminPasswordHash = await hashPassword('admin123');

  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.username, 'admin'))
    .limit(1);

  let adminId: string;

  if (existingAdmin.length === 0) {
    const [inserted] = await db
      .insert(users)
      .values({
        fullName: 'Chandu',
        username: 'admin',
        email: 'admin@worktrack.io',
        passwordHash: adminPasswordHash,
        role: 'admin',
        isActive: true,
      })
      .returning();
    adminId = inserted.id;
    console.log(`  + Created admin user: Chandu (@admin)`);
  } else {
    adminId = existingAdmin[0].id;
    // Ensure name is Chandu
    await db
      .update(users)
      .set({
        fullName: 'Chandu',
        role: 'admin',
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, adminId));
    console.log(`  = Verified admin user: Chandu (@admin)`);
  }

  // 3. Assign Admin to all 3 departments
  for (const deptSlug of ['software', 'video-editor', 'digital-marketing']) {
    const deptId = deptMap.get(deptSlug);
    if (deptId) {
      const existingAssignment = await db
        .select()
        .from(userDepartments)
        .where(
          and(
            eq(userDepartments.userId, adminId),
            eq(userDepartments.departmentId, deptId)
          )
        )
        .limit(1);

      if (existingAssignment.length === 0) {
        await db.insert(userDepartments).values({
          userId: adminId,
          departmentId: deptId,
        });
        console.log(`    -> Assigned admin to ${deptSlug}`);
      }
    }
  }

  console.log('✅ Clean baseline seed completed successfully (No mock data created)!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Database seed failed:', err);
  process.exit(1);
});
