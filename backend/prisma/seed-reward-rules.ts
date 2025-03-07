import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define reward types and transaction types as they are in the schema
type RewardType = 'CASHBACK' | 'POINTS' | 'MILES';
type TransactionType = 'ONLINE' | 'OFFLINE' | 'BOTH';

async function main() {
  console.log('Starting to seed reward rules...');

  // Get all credit cards
  const creditCards = await prisma.creditCard.findMany();
  if (creditCards.length === 0) {
    console.log('No credit cards found. Please add credit cards first.');
    return;
  }
  console.log(`Found ${creditCards.length} credit cards.`);

  // Get all categories
  const categories = await prisma.transactionCategory.findMany({
    include: {
      subCategories: true,
    },
  });
  if (categories.length === 0) {
    console.log('No categories found. Please add categories first.');
    return;
  }
  console.log(`Found ${categories.length} categories.`);

  // Delete existing reward rules
  await prisma.rewardRule.deleteMany({});
  console.log('Deleted existing reward rules.');

  // Create reward rules for each credit card
  for (const card of creditCards) {
    console.log(`Creating reward rules for card: ${card.name}`);

    // Assign different reward rates to different categories for each card
    for (const category of categories) {
      // Base reward rate (1-2%)
      const baseRate = Math.random() * 1 + 1;
      
      // Create a rule for the main category
      await prisma.rewardRule.create({
        data: {
          creditCardId: card.id,
          categoryId: category.id,
          rewardType: getRandomRewardType(),
          rewardValue: parseFloat(baseRate.toFixed(2)),
          transactionType: 'BOTH' as TransactionType,
        },
      });

      // For some cards, add higher rewards for specific subcategories
      if (Math.random() > 0.5 && category.subCategories.length > 0) {
        // Pick a random subcategory
        const subCategory = category.subCategories[Math.floor(Math.random() * category.subCategories.length)];
        
        // Higher reward rate for subcategory (3-5%)
        const bonusRate = Math.random() * 2 + 3;
        
        await prisma.rewardRule.create({
          data: {
            creditCardId: card.id,
            categoryId: category.id,
            subCategoryId: subCategory.id,
            rewardType: getRandomRewardType(),
            rewardValue: parseFloat(bonusRate.toFixed(2)),
            transactionType: 'BOTH' as TransactionType,
          },
        });
      }
    }
  }

  console.log('Reward rules seeding completed!');
}

function getRandomRewardType(): RewardType {
  const types: RewardType[] = ['CASHBACK', 'POINTS', 'MILES'];
  return types[Math.floor(Math.random() * types.length)];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 