const axios = require('axios');
const { count } = require('console');
const fs = require('fs');

const itemsJson = fs.readFileSync('docs/items.json', 'utf-8');
const itemsData = JSON.parse(itemsJson);
const items = itemsData.map(item => item.UniqueName);
const itemsNames = itemsData.map(item => item.LocalizedNames && item.LocalizedNames['EN-US'] ? item.LocalizedNames['EN-US'] : 'Unknown');
const itemsLength = items.length;
const counter = itemsLength;

const city_Buying = 'Martlock'
const city_Selling = 'BlackMarket'

async function getPriceDifferences(itemIds) {
  const itemsParam = itemIds.join(',');
  try {
    const response = await axios.get(`https://www.albion-online-data.com/api/v2/stats/prices/${itemsParam}?locations=${city_Buying},${city_Selling}&qualities=1`);
    const prices = response.data;
    return prices;
  } catch (error) {
    console.error(`Failed to fetch prices for items: ${itemsParam}`, error);
    return null;
  }
}

function savePartialResults(priceDifferences, filename) {
  fs.writeFileSync(`tempresults/${filename}`, JSON.stringify(priceDifferences, null, 2));
  console.log(`Partial results saved to tempresults/${filename}`);
}

async function calculateArbitrageOpportunities() {
  const batchSize = 100;
  const priceDifferences = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNames = itemsNames.slice(i, i + batchSize);

    const prices = await getPriceDifferences(batch);

    if (prices) {
      for (const [index, item] of batch.entries()) {
        const price1 = prices.find(price => price.item_id === item && price.city === `${city_Buying}`)?.sell_price_min; //Where you are buying
        const price2 = prices.find(price => price.item_id === item && price.city === `${city_Selling}`)?.buy_price_max; //Where you are selling

        if (price2 && price1) {
          const difference = price2 - price1;
          const ratio = difference / price2
          priceDifferences.push({ itemId: batchNames[index], Buying_Price: price1, ratio, Selling_Price:price2, difference });
        }
      }
    }

    // Save partial results every batch
    savePartialResults(priceDifferences, `partial-results-${i + batchSize}.json`);
  }

  // Sort price differences by largest arbitrage opportunity
  priceDifferences.sort((a, b) => b.difference - a.difference);

  // Save the final results to a file
  fs.writeFileSync(`arbitrage-${city_Buying}-to-${city_Selling}.json`, JSON.stringify(priceDifferences, null, 2));

  priceDifferences.sort((a,b)=> b.ratio - a.ratio);
  fs.writeFileSync(`MartlockSells/arbitrage-${city_Buying}-to-${city_Selling}-RATIO.json`, JSON.stringify(priceDifferences, null, 2));


  console.log('Arbitrage opportunities saved to arbitrage-opportunities.json');
}

calculateArbitrageOpportunities();
