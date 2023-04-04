const axios = require('axios');
const { count } = require('console');
const fs = require('fs');

const itemsJson = fs.readFileSync('items.json', 'utf-8');
const itemsData = JSON.parse(itemsJson);
/* *|MARCADOR_CURSOR|* */
/* *|MARKER_CURSOR|* */
/* *|MARCADOR_CURSOR|* */
const items = itemsData.map(item=>item.UniqueName)

const itemsLength = items.length;
const counter = itemsLength;

let counterRunner = 0

async function getPriceDifference(itemId) {
    try {
      const response = await axios.get(`https://www.albion-online-data.com/api/v2/stats/prices/${itemId}?locations=Bridgewatch,Martlock&qualities=1`);
      const prices = response.data;

      counterRunner = counterRunner + 1

    const BridgewatchPrice = prices[0].sell_price_min
    const MartlockPrice = prices[1].sell_price_min
      
    //   console.log(prices[0].sell_price_min)
    //   console.log(prices[1].sell_price_min)

      const sellPrice = prices.find(price=>price.sell_price_min)

      console.log('There are '+ (counter - counterRunner)+' items left')
      
        



      if (!MartlockPrice || !BridgewatchPrice) {
        return null;
      }
  
      const difference = Math.abs(MartlockPrice - BridgewatchPrice);
      return { itemId, difference };
    } catch (error) {
      console.error(`Failed to fetch price for item: ${itemId}`, error);
      return null;
    }
  }

  function savePartialResults(priceDifferences, filename) {
    fs.writeFileSync(filename, JSON.stringify(priceDifferences, null, 2));
    console.log(`Partial results saved to ${filename}`);
  }
  
  
//   async function calculateArbitrageOpportunities() {
//     const priceDifferences = [];
  
//     for (const item of items) {
//       const priceDifference = await getPriceDifference(item);
//     //   console.log(item);
//       if (priceDifference) {
//         priceDifferences.push(priceDifference);
//       }
//     }
  
//     // Sort price differences by largest arbitrage opportunity
//     priceDifferences.sort((a, b) => b.difference - a.difference);
  
//     // Save the results to a file
//     fs.writeFileSync('arbitrage-opportunities.json', JSON.stringify(priceDifferences, null, 2));
//     console.log('Arbitrage opportunities saved to arbitrage-opportunities.json');
//   }
  
  
  async function calculateArbitrageOpportunities() {
    const priceDifferences = [];
    const delayMs = 100; // Add desired delay in milliseconds here
    const saveInterval = 100;
  
    for (const [index, item] of items.entries()) {
      const priceDifference = await getPriceDifference(item);
      if (priceDifference) {
        priceDifferences.push(priceDifference);
      }
  
      // Save partial results every 100 entries
      if ((index + 1) % saveInterval === 0) {
        savePartialResults(priceDifferences, `partial-results-${index + 1}.json`);
      }
    }
  
    // Sort price differences by largest arbitrage opportunity
    priceDifferences.sort((a, b) => b.difference - a.difference);
  
    // Save the final results to a file
    fs.writeFileSync('arbitrage-opportunities.json', JSON.stringify(priceDifferences, null, 2));
    console.log('Arbitrage opportunities saved to arbitrage-opportunities.json');
  }
  calculateArbitrageOpportunities();
