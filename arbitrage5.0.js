const {market}=require('./sorting-house/market');

const axios = require('axios');
const { count } = require('console');
const fs = require('fs');

//Read itemsJson
const itemsJson = fs.readFileSync('docs/item_list_new.json', 'utf-8');
const itemsData = JSON.parse(itemsJson);
const items = itemsData.map(item => item.itemId);
const itemsNames = itemsData.map(item => item.LocalizedNames);
const itemTags = itemsData.map(item => item.itemTag)
const itemsLength = items.length;

//https://www.albion-online-data.com/api/v2/stats/view/${itemsParam}?locations=7,1002,1012,2004,3003,3005,3008,4002

const BlackMarket = new market('3003', 'Black Market')
const Bridgewatch = new market('2004', 'Bridgewatch')
const Martlock = new market('3008', 'Martlock')
const Caerleon = new market('3005', 'Caerleon')
const Thetford = new market('7', 'Thetford')
const Lymhurst = new market('1002', 'Lymhurst')
const FortSterling = new market('4002', 'Fort Sterling')


const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const marketList = [
  BlackMarket,
  Bridgewatch,
  Martlock,
  Caerleon,
  Thetford,
  Lymhurst,
  FortSterling
]

// rl.question(userInput, (userInput) => {
//   console.log(`Press Enter to loadi the Best Trades in the Albion Universe`);
//   rl.close();
//   startCalculating();
// });

console.log(
  `Cities Being Loaded:
1. ${marketList[0].marketName}
2. ${marketList[1].marketName}
3. ${marketList[2].marketName}
4. ${marketList[3].marketName}
5. ${marketList[4].marketName}
6. ${marketList[5].marketName}
7. ${marketList[6].marketName}
`)

function startCalculating() {
  calculateArbitrageOpportunities();
}

async function getPriceDifferences(itemIds) {
  const itemsParam = itemIds.join(',');
  try {
    const response = await axios.get(`https://www.albion-online-data.com/api/v2/stats/prices/${itemsParam}?locations=7,1002,1012,2004,3003,3005,3008,4002`);
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
  let batchNumber = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    batchNumber++;
    const batch = items.slice(i, i + batchSize);
    const batchNames = itemsNames.slice(i, i + batchSize);
    const batchTags = itemTags.slice(i , i + batchSize)

    const prices = await getPriceDifferences(batch);

    if (prices) {
      for (const [index, item] of batch.entries()) {
        for (const selectedMarket of marketList) {
          const marketPrices = marketList.map((market) => {
            if (market === selectedMarket) {
              return prices.find(
                (price) =>
                  price.item_id === item && price.city === market.marketName
              )?.sell_price_min;
            } else {
              return prices.find(
                (price) =>
                  price.item_id === item && price.city === market.marketName
              )?.buy_price_max;
            }
          });

          const selectedMarketIndex = marketList.findIndex(
            (market) => market === selectedMarket
          );

          for (const [otherIndex, price2] of marketPrices.entries()) {
            if (otherIndex === selectedMarketIndex) continue; // Skip comparing the same market

            const price1 = marketPrices[selectedMarketIndex];
      
            if (price2 && price1) {
              const difference = price2 - price1;
              const ratio = difference / price2;
              priceDifferences.push({
                itemId: batch[index],
                itemName: batchNames[index],
                itemTag: batchTags[index],
                selectedMarket: selectedMarket.marketName,
                otherMarket: marketList[otherIndex].marketName,
                Buying_Price: price1,
                Selling_Price: price2,
                silver_profit: difference,
                Ratio: ratio,
              });
            }
          }
        }
      }
    }
    

    // Save partial results every batch
    savePartialResults(priceDifferences, `partial-results-${batchNumber * batchSize}.json`);
  }

  // Save results for each city pair
  saveCityPairResults(priceDifferences);
}

// ... (previous code)

// Save the final results to a file for each city pair
function saveCityPairResults(priceDifferences) {
  for (const selectedMarket of marketList) {
    for (const otherMarket of marketList) {
      if (selectedMarket === otherMarket) continue;

      const outputDir = `markets/${selectedMarket.marketName}/to_${otherMarket.marketName}`;
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filteredDifferences = priceDifferences.filter(
        (priceDifference) =>
          priceDifference.selectedMarket === selectedMarket.marketName &&
          priceDifference.otherMarket === otherMarket.marketName
      );

      const sortedByDifference = [...filteredDifferences].sort(
        (a, b) => b.silver_profit - a.silver_profit
      );
      fs.writeFileSync(
        `${outputDir}/arbitrage-DIFFERENCE.json`,
        JSON.stringify(sortedByDifference, null, 2)
      );

      const sortedByRatio = [...filteredDifferences].sort(
        (a, b) => b.Ratio - a.Ratio
      );
      fs.writeFileSync(
        `${outputDir}/arbitrage-RATIO.json`,
        JSON.stringify(sortedByRatio, null, 2)
      );
    }
  }
}

// ... (previous code)

// Call the calculateArbitrageOpportunities function directly to start the program
calculateArbitrageOpportunities()

module.exports = {
  calculateArbitrageOpportunities,
};

