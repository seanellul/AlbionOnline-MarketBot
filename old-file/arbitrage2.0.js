const axios = require('axios');
const { count } = require('console');
const fs = require('fs');

const itemsJson = fs.readFileSync('items.json', 'utf-8');
const itemsData = JSON.parse(itemsJson);
const items = itemsData.map(item=>item.UniqueName)
const items_Names = itemsData.map(item=>item.LocalizedNames["1"])
const itemsLength = items.length;
const counter = itemsLength;

async function getPriceDifferences(itemIds) {
    const itemsParam = itemIds.join(',');
    try {
      const response = await axios.get(`https://www.albion-online-data.com/api/v2/stats/prices/${itemsParam}?locations=Martlock,Caerleon&qualities=1`);
      const prices = response.data;
      return prices;
    } catch (error) {
      console.error(`Failed to fetch prices for items: ${itemsParam}`, error);
      return null;
    }
  }

  function savePartialResults(priceDifferences, filename) {
    fs.writeFileSync(filename, JSON.stringify(priceDifferences, null, 2));
    console.log(`Partial results saved to ${filename}`);
  }

  async function calculateArbitrageOpportunities() {
    const batchSize = 100;
    const priceDifferences = [];
  
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchNames = items_Names.slice(i, i + batchSize);

      const prices = await getPriceDifferences(batch);
  
      if (prices) {
        for (const item of batch) {
            
        //   const martlockPrice = prices.find(price => price.item_id === item && price.city === 'Martlock')?.buy_price_max;
        //   const bridgewatchPrice = prices.find(price => price.item_id === item && price.city === 'Caerleon')?.sell_price_min;

        const price1 = prices.find(price => price.item_id === item && price.city === 'Martlock')?.sell_price_min;
        const price2 = prices.find(price => price.item_id === item && price.city === 'Caerleon')?.buy_price_max;
  
          if (price2 && price1) {
            const difference = price2 - price1;
            for(const itemNames of batchNames){
            priceDifferences.push({ itemId: itemNames, difference });
            }  
        }
        }
      }
  
      // Save partial results every batch
      savePartialResults(priceDifferences, `partial-results-${i + batchSize}.json`);
    }
  
    // Sort price differences by largest arbitrage opportunity
    priceDifferences.sort((a, b) => b.difference - a.difference);
  
    // Save the final results to a file
    fs.writeFileSync('arbitrage-opportunities.json', JSON.stringify(priceDifferences, null, 2));
    console.log('Arbitrage opportunities saved to arbitrage-opportunities.json');
  }
  
  calculateArbitrageOpportunities();
  


  