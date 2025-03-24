# Maximize CC Reward - Credit Card Reward Maximizer

A comprehensive platform to help users maximize their credit card rewards and make informed decisions about which cards to use for different purchases.

## Features

### 1. Dashboard
![dashboard snap](https://github.com/PranayHaldiya/Maximize-CCreward/blob/main/frontend/public/Screenshot%202025-03-19%20141647.png)
- **Overview**: Quick snapshot of all your credit cards and total rewards
- **Reward Summary**:
  - Total cashback earned
  - Total points accumulated
  - Total miles earned
  - Category-wise breakdown of rewards
- **Dark/Light Mode**: Toggle between dark and light themes for comfortable viewing

### 2. Credit Card Management
![credit card snap](https://github.com/PranayHaldiya/Maximize-CCreward/blob/main/frontend/public/Screenshot%202025-03-19%20141701.png)
- **Card Portfolio**:
  - Add multiple credit cards to your profile
  - View all your cards in an organized grid layout
  - Secure storage of card details (only last 4 digits visible)
  - Track expiry dates
- **Card Details**:
![card details snap](https://github.com/PranayHaldiya/Maximize-CCreward/blob/main/frontend/public/Screenshot%202025-03-19%20141718.png)
  - Bank information
  - Card type
  - Reward balances
  - Card-specific reward rules

### 3. Reward Calculator
![reward calculator snap](https://github.com/PranayHaldiya/Maximize-CCreward/blob/main/frontend/public/Screenshot%202025-03-19%20141730.png)
- **Smart Calculation**:
  - Input transaction amount and category
  - Get instant reward calculations for all your cards
  - See which card offers the best rewards for your purchase
- **Category Support**:
  - Multiple spending categories
  - Sub-category specifications
  - Support for both online and offline transactions
- **Detailed Results**:
  - Reward amount for each card
  - Percentage/multiplier rates
  - Monthly caps and minimum spend requirements

### 4. Card Comparison
![card comparision snap](https://github.com/PranayHaldiya/Maximize-CCreward/blob/main/frontend/public/Screenshot%202025-03-19%20141742.png)
- **Side-by-Side Comparison**:
  - Compare up to 3 cards simultaneously
  - Easy-to-read comparison table
  - Category-wise reward rates
- **Detailed Metrics**:
  - Reward rates by category
  - Annual fees
  - Monthly caps
  - Minimum spend requirements
- **Visual Indicators**:
  - Color-coded reward types (Cashback/Points/Miles)
  - Best card highlighting for each category

### 5. User Experience
- **Responsive Design**:
  - Works seamlessly on desktop and mobile devices
  - Intuitive navigation
  - Clean and modern interface
- **Accessibility**:
  - Dark mode support
  - High contrast text
  - Screen reader friendly
- **Security**:
  - Secure authentication
  - Protected card information
  - Token-based API access

### 6. Reward Types Support
- **Multiple Reward Types**:
  - Cashback rewards
  - Points programs
  - Air miles
- **Flexible Calculations**:
  - Percentage-based rewards
  - Points multipliers
  - Mile accumulation rates
    
## Admin Demo Screenshots
![card snap](https://github.com/PranayHaldiya/Maximize-CCreward/blob/main/frontend/public/Screenshot%202025-03-19%20141817.png)

![bank snap](https://github.com/PranayHaldiya/Maximize-CCreward/blob/main/frontend/public/Screenshot%202025-03-19%20141827.png)

![category snap](https://github.com/PranayHaldiya/Maximize-CCreward/blob/main/frontend/public/Screenshot%202025-03-19%20141853.png)

![reward rules snap](https://github.com/PranayHaldiya/Maximize-CCreward/blob/main/frontend/public/Screenshot%202025-03-19%20141908.png)

## Technical Features

### Frontend
- Built with Next.js 13+ (App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- Responsive design
- Dark mode support
- Client-side form validation
- Interactive UI components

### Backend
- RESTful API architecture
- Secure authentication
- Database integration
- Real-time calculations
- Data validation and sanitization

## Getting Started

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install dependencies
```bash
cd frontend and cd backend
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Run the frontend
```bash
npm run dev
```
Run the backend
```bash
npm run start:dev   
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env` file in the frontend directory with the following variables:
```
NEXT_PUBLIC_API_URL=your_api_url
```
Create a `.env.` file in the backend directory with the following variables:
```
DATABASE_URL=
```
# JWT Authentication
```
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="1d"
```
# Server Configuration
```
PORT=3001
NODE_ENV="development"
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Roadmap

- [ ] Add support for multiple currencies
- [ ] Implement reward redemption tracking
- [ ] Add spending pattern analysis
- [ ] Integrate with bank APIs for real-time reward tracking
- [ ] Add mobile app support
- [ ] Implement reward optimization suggestions
- [ ] Add support for international cards
