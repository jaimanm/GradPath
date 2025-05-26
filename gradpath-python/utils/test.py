import json

with open('data/parsed_prerequisites_cleaned.json', 'r') as f:
    data = json.load(f)

# Print the first 5 items in the data
for i in range(5):
    print(data[i])
    