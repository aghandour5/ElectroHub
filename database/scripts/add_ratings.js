const pool = require('../../config/db');

async function addRatings() {
  try {
    const res = await pool.query('SELECT id FROM products');
    const products = res.rows;
    
    const names = ["Alex T.", "Sarah M.", "Jordan K.", "Emily R.", "Michael B.", "Jessica W.", "David L.", "Chris P.", "Amanda J.", "Ryan S."];
    const comments = [
      "Absolutely love it. Great quality and fast shipping!",
      "Exceeded my expectations. Would definitely recommend to anyone.",
      "Really solid product, works exactly as described.",
      "Decent for the price, but could be better.",
      "Five stars! Best purchase I've made this year.",
      "Not bad, it does the job.",
      "Incredible build quality. Feels very premium.",
      "It's okay, nothing special but it works.",
      "Fantastic value for money. Highly recommended.",
      "A bit disappointed with the battery life, but otherwise good."
    ];
    
    for (let p of products) {
      // Random number of reviews between 1 and 6
      const numReviews = Math.floor(Math.random() * 6) + 1;
      const reviews = [];
      let totalRating = 0;
      
      for (let i = 0; i < numReviews; i++) {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomComment = comments[Math.floor(Math.random() * comments.length)];
        // Random rating between 3 and 5 for each review
        const reviewRating = Math.floor(Math.random() * 3) + 3; 
        
        reviews.push({ author: randomName, rating: reviewRating, text: randomComment });
        totalRating += reviewRating;
      }
      
      const averageRating = (totalRating / numReviews).toFixed(1);
      
      await pool.query(
        'UPDATE products SET rating = $1, reviews_data = $2 WHERE id = $3',
        [averageRating, JSON.stringify(reviews), p.id]
      );
    }
    
    console.log(`Successfully added diverse fake ratings and reviews to ${products.length} products!`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addRatings();

addRatings();
