import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding transaction categories...');

  // Define categories with their subcategories
  const categories = [
    {
      name: 'Dining',
      subCategories: ['Restaurants', 'Fast Food', 'Cafes', 'Bars']
    },
    {
      name: 'Travel',
      subCategories: ['Airlines', 'Hotels', 'Car Rentals', 'Cruises', 'Travel Agencies']
    },
    {
      name: 'Groceries',
      subCategories: ['Supermarkets', 'Specialty Food Stores', 'Farmers Markets']
    },
    {
      name: 'Entertainment',
      subCategories: ['Movies', 'Concerts', 'Streaming Services', 'Theme Parks']
    },
    {
      name: 'Shopping',
      subCategories: ['Department Stores', 'Clothing', 'Electronics', 'Online Retailers']
    },
    {
      name: 'Transportation',
      subCategories: ['Gas Stations', 'Public Transit', 'Rideshare', 'Parking']
    },
    {
      name: 'Health',
      subCategories: ['Pharmacies', 'Gyms', 'Doctor Visits', 'Hospitals']
    },
    {
      name: 'Utilities',
      subCategories: ['Electricity', 'Water', 'Internet', 'Phone', 'Cable TV']
    }
  ];

  // Create categories and subcategories
  for (const category of categories) {
    console.log(`Creating category: ${category.name}`);
    
    // Check if category already exists
    const existingCategory = await prisma.transactionCategory.findUnique({
      where: { name: category.name }
    });
    
    // If category doesn't exist, create it
    const categoryRecord = existingCategory || await prisma.transactionCategory.create({
      data: { name: category.name }
    });
    
    // Create subcategories
    for (const subCategoryName of category.subCategories) {
      // Check if subcategory already exists
      const existingSubCategory = await prisma.transactionSubCategory.findFirst({
        where: {
          name: subCategoryName,
          categoryId: categoryRecord.id
        }
      });
      
      // If subcategory doesn't exist, create it
      if (!existingSubCategory) {
        console.log(`  Creating subcategory: ${subCategoryName}`);
        await prisma.transactionSubCategory.create({
          data: {
            name: subCategoryName,
            categoryId: categoryRecord.id
          }
        });
      } else {
        console.log(`  Subcategory already exists: ${subCategoryName}`);
      }
    }
  }

  console.log('Transaction categories seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 

