import json

with open('data/parsed_prerequisites.json', 'r') as f:
    data = json.load(f)

print(len(data))

# Step 1: Remove entries where the value is exactly {"type": "none"}
filtered_data = {k: v for k, v in data.items() if v != {"type": "none"}}

def clean_entry(entry):
    if isinstance(entry, dict):
        # Remove keys with {"type": "none"}
        if entry == {"type": "none"}:
            return None
        # Remove dicts with 'courses': [] after cleaning
        if 'courses' in entry and isinstance(entry['courses'], list):
            # Recursively clean the list
            entry['courses'] = [clean_entry(e) for e in entry['courses']]
            entry['courses'] = [e for e in entry['courses'] if e is not None]
            if len(entry['courses']) == 0:
                entry.pop('courses')
        # Recursively clean children if present
        if 'children' in entry and isinstance(entry['children'], list):
            entry['children'] = [clean_entry(e) for e in entry['children']]
            entry['children'] = [e for e in entry['children'] if e is not None]
            if len(entry['children']) == 0:
                entry.pop('children')
        # Remove dicts with no 'course' or 'courses' or 'children' left
        keys = set(entry.keys())
        if not (('course' in keys and entry['course']) or ('courses' in keys and entry['courses']) or ('children' in keys and entry['children'])):
            return None
        # Clean nested dicts
        for k in list(entry.keys()):
            cleaned = clean_entry(entry[k])
            if cleaned is None:
                entry.pop(k)
            else:
                entry[k] = cleaned
        return entry if entry else None
    elif isinstance(entry, list):
        new_list = [clean_entry(item) for item in entry]
        new_list = [item for item in new_list if item is not None]
        return new_list if new_list else None
    else:
        return entry

cleaned_data = {}
for k, v in filtered_data.items():
    cleaned = clean_entry(v)
    if cleaned is not None:
        cleaned_data[k] = cleaned

print(len(cleaned_data))
# Optionally, write to a new file
with open('data/parsed_prerequisites_cleaned.json', 'w') as f:
    json.dump(cleaned_data, f, indent=2)