import { Project } from '../modules/projects/project.model.js';

export const seedDatabase = async () => {
  try {
    const projectCount = await Project.countDocuments();
    
    if (projectCount === 0) {
      console.log('Database empty. Seeding initial demo projects...');
      
      const demoProjects = [
        {
          name: '[DEMO] River Restoration — Ranchi',
          description: 'Synthetic demo data tracking the cleanup and restoration efforts along the primary riverbank in Ranchi.',
          organization: 'Waterways Initiative',
          status: 'ACTIVE',
          locations: ['Ranchi', 'Riverbank Zone A', 'Riverbank Zone B'],
        },
        {
          name: '[DEMO] Community Afforestation — Jharkhand',
          description: 'Synthetic demo data tracking community sapling plantation and long-term tree survival tracking.',
          organization: 'Green Canopy NGO',
          status: 'ACTIVE',
          locations: ['Jharkhand', 'Sector 4', 'Village A'],
        },
        {
          name: '[DEMO] Rural Water Infrastructure',
          description: 'Synthetic demo data tracking the construction of new water purification systems in remote locations.',
          organization: 'SafeWater Global',
          status: 'PLANNED',
          locations: ['Rural District 1'],
        }
      ];

      await Project.insertMany(demoProjects);
      console.log('Successfully seeded 3 demo projects.');
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
};
