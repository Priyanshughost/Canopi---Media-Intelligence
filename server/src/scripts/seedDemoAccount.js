import bcrypt from 'bcryptjs';
import { Organization } from '../modules/auth/organization.model.js';
import { User } from '../modules/auth/user.model.js';
import { Project } from '../modules/projects/project.model.js';
import { DEMO_CREDENTIALS } from '../modules/auth/auth.controller.js';

/**
 * Seeds the demo organization and demo user account if they don't already exist.
 * Automatically associates any existing projects in the database with the demo organization
 * so demo/testing logins have immediate access to all existing projects, media, evidence, and reports.
 */
export const seedDemoAccount = async () => {
  try {
    console.log('[Seed] Checking for demo organization & account...');

    let demoOrg = await Organization.findOne({ name: DEMO_CREDENTIALS.organizationName });
    if (!demoOrg) {
      demoOrg = await Organization.create({
        name: DEMO_CREDENTIALS.organizationName,
        type: DEMO_CREDENTIALS.organizationType,
      });
      console.log(`[Seed] Created demo organization: ${demoOrg.name} (${demoOrg._id})`);
    }

    let demoUser = await User.findOne({ email: DEMO_CREDENTIALS.email });
    if (!demoUser) {
      const passwordHash = await bcrypt.hash(DEMO_CREDENTIALS.password, 10);
      demoUser = await User.create({
        name: DEMO_CREDENTIALS.name,
        email: DEMO_CREDENTIALS.email,
        passwordHash,
        organizationId: demoOrg._id,
      });
      console.log(`[Seed] Created demo user account: ${demoUser.email} / ${DEMO_CREDENTIALS.password}`);
    } else if (!demoUser.organizationId) {
      demoUser.organizationId = demoOrg._id;
      await demoUser.save();
    }

    // Auto-migrate any existing unassigned projects to belong to this demo organization!
    const unassignedProjects = await Project.find({
      $or: [{ organizationId: { $exists: false } }, { organizationId: null }],
    });

    if (unassignedProjects.length > 0) {
      console.log(`[Seed] Associating ${unassignedProjects.length} existing project(s) to Demo Organization...`);
      await Project.updateMany(
        { $or: [{ organizationId: { $exists: false } }, { organizationId: null }] },
        { $set: { organizationId: demoOrg._id } }
      );
    }

    console.log('[Seed] Demo account & project association ready.');
    return { demoOrg, demoUser };
  } catch (error) {
    console.error('[Seed] Error during demo account seeding:', error);
  }
};

// Allow standalone CLI execution: `node src/scripts/seedDemoAccount.js`
if (process.argv[1]?.endsWith('seedDemoAccount.js')) {
  import('mongoose').then(async (mongoose) => {
    import('../config/env.js').then(async () => {
      const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/canopi';
      await mongoose.default.connect(mongoUri);
      console.log('[Seed] Connected to MongoDB');
      await seedDemoAccount();
      await mongoose.default.disconnect();
      console.log('[Seed] Done.');
      process.exit(0);
    });
  });
}
