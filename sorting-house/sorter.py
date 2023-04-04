import json

# Read the input JSON file
with open('arbitrage-RATIO.json', 'r') as file:
    data = json.load(file)

# Extracting "itemID", "itemName", and "itemTag" values from the list of dictionaries
items = [{"itemId": entry["itemId"], "LocalizedNames": entry["itemName"], "itemTag": entry["itemTag"]} for entry in data]

# Save the extracted data to a new JSON file
with open('blackmarket_items.json', 'w') as file:
    json.dump(items, file, indent=4)
