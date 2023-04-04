const express = require('express');
const cors = require('cors');
const { calculateArbitrageOpportunities } = require('./arbitrage5.0.js');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/api/calculateArbitrage', async (req, res) => {
  try {
    const results = await calculateArbitrageOpportunities();
    res.json(results);
  } catch (error) {
    console.error('Error calculating arbitrage opportunities:', error);
    res.status(500).send('Error calculating arbitrage opportunities');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
