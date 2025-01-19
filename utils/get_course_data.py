'''
WARNING: THIS SCRIPT TAKES A LONG TIME TO RUN AND WILL OVERRIDE THE DATA STORED IN courses.json

IT HAS BEEN COMMENTED OUT FOR SAFETY REASONS
'''


# import requests
# import json

# def fetch_all_courses():
#     courses = []
#     page = 1
#     per_page = 100
#     url = f"https://api.umd.io/v1/courses?per_page={per_page}"

#     while True:
#         response = requests.get(url)
#         new_courses = response.json()
#         courses.extend(new_courses)
        
#         print(f"Fetched {len(new_courses)} courses from page {page}")
        
#         # Check if we've reached the last page
#         if len(new_courses) < per_page:
#             break
        
#         # Prepare for the next page
#         page += 1
#         url = f"https://api.umd.io/v1/courses?per_page={per_page}&page={page}"

#     return courses

# # Fetch all courses
# all_courses = fetch_all_courses()

# # Save the courses to a JSON file
# with open('courses.json', 'w') as f:
#     json.dump(all_courses, f)

# print(f"Total courses fetched: {len(all_courses)}")