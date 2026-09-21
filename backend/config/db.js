import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB database using Mongoose
 */
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.warn('⚠️ [Database Warning]: MONGO_URI is not set in environment variables.');
      console.warn('   Please create a .env file based on .env.example to connect to MongoDB.');
      return;
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ [Database]: MongoDB Connected: ${conn.connection.host}`);

    // Ensure default demo user & demo organizations exist for seamless evaluation & testing
    try {
      const User = (await import('../models/User.js')).default;
      const Organization = (await import('../models/Organization.js')).default;
      const BusinessConnection = (await import('../models/BusinessConnection.js')).default;
      const Project = (await import('../models/Project.js')).default;

      // 1. Ensure Alex Morgan user exists
      let alexUser = await User.findOne({ email: 'alex.morgan@buildops.ai' });
      if (!alexUser) {
        alexUser = await User.create({
          name: 'Alex Morgan',
          email: 'alex.morgan@buildops.ai',
          password: 'Password123!',
          role: 'Project Director',
        });
        console.log('👤 [Database]: Initialized default demo account: alex.morgan@buildops.ai');
      }

      // 2. Ensure XYZ City Infrastructure (Ahmedabad) exists
      let xyzOrg = await Organization.findOne({ name: 'XYZ City Infrastructure' });
      if (!xyzOrg) {
        xyzOrg = await Organization.create({
          name: 'XYZ City Infrastructure',
          type: 'Infrastructure Developer',
          location: 'Ahmedabad',
          code: 'XYZ-AHM-01',
          adminUser: alexUser._id,
          description: 'Specialized in urban high-rise and transit infrastructure projects across Ahmedabad metro region.',
          members: [{ user: alexUser._id, role: 'Project Director', joinedAt: new Date() }],
        });
        console.log('🏢 [Database]: Initialized demo organization: XYZ City Infrastructure (Ahmedabad)');
      }

      // Link Alex to XYZ City Infrastructure
      if (!alexUser.organizationId || alexUser.organizationId.toString() !== xyzOrg._id.toString()) {
        alexUser.organizationId = xyzOrg._id;
        await alexUser.save();
      }

      // 3. Ensure Ramesh Patel user (Village Builder partner) exists
      let rameshUser = await User.findOne({ email: 'ramesh.patel@abcvillage.com' });
      if (!rameshUser) {
        rameshUser = await User.create({
          name: 'Ramesh Patel',
          email: 'ramesh.patel@abcvillage.com',
          password: 'Password123!',
          role: 'Managing Director',
        });
        console.log('👤 [Database]: Initialized village partner demo account: ramesh.patel@abcvillage.com');
      }

      // 4. Ensure ABC Village Construction (Sanand) exists
      let abcOrg = await Organization.findOne({ name: 'ABC Village Construction' });
      if (!abcOrg) {
        abcOrg = await Organization.create({
          name: 'ABC Village Construction',
          type: 'Village Builder',
          location: 'Sanand',
          code: 'ABC-SAN-02',
          adminUser: rameshUser._id,
          description: 'Regional contractor delivering rural housing, supply warehouses, and peripheral industrial substations.',
          members: [{ user: rameshUser._id, role: 'Managing Director', joinedAt: new Date() }],
        });
        console.log('🏡 [Database]: Initialized demo organization: ABC Village Construction (Sanand)');
      }

      // Link Ramesh to ABC Village Construction
      if (!rameshUser.organizationId || rameshUser.organizationId.toString() !== abcOrg._id.toString()) {
        rameshUser.organizationId = abcOrg._id;
        await rameshUser.save();
      }

      // 5. Ensure active business connection between XYZ City Infrastructure & ABC Village Construction
      const existingConn = await BusinessConnection.findOne({
        $or: [
          { requestingOrganization: xyzOrg._id, receivingOrganization: abcOrg._id },
          { requestingOrganization: abcOrg._id, receivingOrganization: xyzOrg._id },
        ],
      });

      if (!existingConn) {
        await BusinessConnection.create({
          requestingOrganization: abcOrg._id,
          receivingOrganization: xyzOrg._id,
          requestedBy: rameshUser._id,
          acceptedBy: alexUser._id,
          status: 'Accepted',
          permissions: ['MATERIAL_ORDERS', 'DELIVERY_STATUS', 'DOCUMENTS'],
          purpose: 'Inter-district material dispatch and joint structural survey collaboration',
        });
        console.log('🤝 [Database]: Initialized accepted B2B connection: ABC Village Construction ↔ XYZ City Infrastructure');
      }

      // 6. Link existing projects without an organizationId to XYZ City Infrastructure
      await Project.updateMany(
        { organizationId: { $exists: false } },
        { organizationId: xyzOrg._id }
      );
    } catch (seedErr) {
      console.warn('⚠️ [Database]: Demo organizations initialization warning:', seedErr.message);
    }
  } catch (error) {
    console.error(`❌ [Database Error]: Failed to connect to MongoDB - ${error.message}`);
    // In production or when strictly required, exit with failure
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
