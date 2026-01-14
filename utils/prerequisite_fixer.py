# This script renames 'courses' to 'children'/'course'

import json

def fix_courses(obj, stats):
    if isinstance(obj, dict):
        # If 'courses' field exists
        if 'courses' in obj:
            if obj.get('type') == 'course':
                # Rename to 'course' and unwrap single-element list
                val = obj['courses']
                if isinstance(val, list) and len(val) == 1:
                    obj['course'] = val[0]
                else:
                    obj['course'] = val
                del obj['courses']
                stats['course'] += 1
            else:
                # Rename to 'children'
                obj['children'] = obj['courses']
                del obj['courses']
                stats['children'] += 1
        # Recurse for all values
        for k, v in list(obj.items()):
            obj[k] = fix_courses(v, stats)
    elif isinstance(obj, list):
        return [fix_courses(item, stats) for item in obj]
    return obj

with open('data/parsed_prerequisites_cleaned.json', 'r') as f:
    data = json.load(f)

stats = {'course': 0, 'children': 0}

for k in data:
    data[k] = fix_courses(data[k], stats)

with open('data/parsed_prerequisites_cleaned_fixed.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Fields changed to 'course': {stats['course']}")
print(f"Fields changed to 'children': {stats['children']}")
