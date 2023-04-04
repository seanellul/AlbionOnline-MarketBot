import json

# Read the input JSON file
with open('arbitrage-RATIO.json', 'r') as input_file:
    input_data = json.load(input_file)

# Extract the specified variables
extracted_data = []
for entry in input_data:
    item_id = entry.get("UniqueName", "")
    localized_name = entry.get("LocalizedNames", {}).get("EN-US", "") if entry.get("LocalizedNames") else ""
    item_tag = entry.get("LocalizationNameVariable", "")

    extracted_data.append({
        "itemId": item_id,
        "LocalizedNames": localized_name,
        "itemTag": item_tag
    })

# Save the extracted data to a new JSON file
with open('output_data.json', 'w') as output_file:
    json.dump(extracted_data, output_file, indent=4)
