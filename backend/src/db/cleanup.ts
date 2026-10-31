import { db } from './index.js';
import { users, departments, userDepartments, projects, dailyActivities } from './schema.js';
import { eq, ne, sql } from 'drizzle-orm';

async function cleanup() {
  console.log('🧹 Starting complete mock data cleanup...');

  // 1. Identify Admin
  const [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.role, 'admin'))
    .limit(1);

  if (!adminUser) {
    throw new Error('Admin account not found in database! Aborting cleanup for safety.');
  }

  console.log(`👤 Found admin account: ${adminUser.username} (${adminUser.id})`);

  // 2. Delete all daily activities (associated with projects/mock employees)
  console.log('🗑️ Deleting all daily activity records...');
  await db.delete(dailyActivities);
  console.log('  ✓ Daily activities cleared.');

  // 3. Delete all projects (employee & admin projects)
  console.log('🗑️ Deleting all projects...');
  await db.delete(projects);
  console.log('  ✓ All projects cleared.');

  // 4. Delete user_departments assignments for non-admin users
  console.log('🗑️ Deleting user_department links for mock employees...');
  await db
    .delete(userDepartments)
    .where(ne(userDepartments.userId, adminUser.id));
  console.log('  ✓ Non-admin user_departments links cleared.');

  // 5. Delete all mock employee accounts from users table
  console.log('🗑️ Deleting all mock employee accounts...');
  const deletedUsers = await db
    .delete(users)
    .where(ne(users.role, 'admin'))
    .returning({ id: users.id, username: users.username, fullName: users.fullName });
  console.log(`  ✓ Removed ${deletedUsers.length} employee account(s):`);
  deletedUsers.forEach((u) => console.log(`     - ${u.fullName} (@${u.username})`));

  // 6. Rename Admin Account to Chandu
  console.log('✏️ Updating admin account name to Chandu...');
  const [updatedAdmin] = await db
    .update(users)
    .set({
      fullName: 'Chandu',
      updatedAt: new Date(),
    })
    .where(eq(users.id, adminUser.id))
    .returning();
  console.log(`  ✓ Admin account updated: ${updatedAdmin.fullName} (@${updatedAdmin.username})`);

  // 7. Ensure Admin is assigned to all active departments
  const allDepts = await db.select().from(departments).where(eq(departments.isActive, true));
  for (const dept of allDepts) {
    const existing = await db
      .select()
      .from(userDepartments)
      .where(
        sql`${userDepartments.userId} = ${adminUser.id} AND ${userDepartments.departmentId} = ${dept.id}`
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userDepartments).values({
        userId: adminUser.id,
        departmentId: dept.id,
      });
      console.log(`  + Assigned admin Chandu to department: ${dept.name}`);
    }
  }

  // 8. Verification Queries
  console.log('\n📊 POST-CLEANUP DATABASE AUDIT:');
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [projCount] = await db.select({ count: sql<number>`count(*)` }).from(projects);
  const [actCount] = await db.select({ count: sql<number>`count(*)` }).from(dailyActivities);
  const [deptCount] = await db.select({ count: sql<number>`count(*)` }).from(departments);

  console.log(`   - Users remaining: ${userCount?.count} (Target: 1 - Chandu Admin)`);
  console.log(`   - Projects remaining: ${projCount?.count} (Target: 0)`);
  console.log(`   - Daily Activities remaining: ${actCount?.count} (Target: 0)`);
  console.log(`   - Departments remaining: ${deptCount?.count} (Target: 3)`);

  const [currentAdmin] = await db.select().from(users).where(eq(users.role, 'admin'));
  console.log(`   - Admin Name: ${currentAdmin?.fullName}`);
  console.log(`   - Admin Username: ${currentAdmin?.username}`);
  console.log(`   - Admin Role: ${currentAdmin?.role}`);

  console.log('\n✅ Cleanup completed successfully!');
  process.exit(0);
}

cleanup().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});

