import json

course_catalog = json.load(open("data/courses.json"))

sample_requirements = [
  "MATH140",
  "MATH141",
  "STAT400",
  "CMSC131",
  "CMSC132",
  "CMSC216",
  "CMSC250",
  "CMSC330",
  "CMSC351",
  "CMSC320",
  "MATH461",
  "CMSC422",
  "CMSC426",
  "CMSC470",
  "CMSC435",
  "MATH401",
  "CMSC460"
]
min_credits = 50

# Now create course objects for the required courses
from object_classes import Course
courses = [Course(course) for course in sample_requirements]

total_credits = sum([int(course.credits) for course in courses])

if total_credits >= min_credits:
  print("You have met the minimum credit requirement for graduation, with a total of", total_credits, "credits.")


# get the prerequisites for each course
course_prerequisites = {
  "MATH461": ["CMSC250"],
  "CMSC216": ["CMSC132"],
  "CMSC330": ["CMSC216", "MATH461"],
  "CMSC351": ["CMSC216"],
  "CMSC320": ["MATH140", "STAT400"],
  "CMSC421": ["CMSC330"],
  "CMSC422": ["CMSC330", "CMSC351"],
  "CMSC426": ["CMSC330", "CMSC351", "MATH461"],
  "CMSC470": ["CMSC320", "CMSC330", "CMSC351", "MATH461"],
  "CMSC435": ["CMSC426"],
  "MATH401": ["CMSC330", "CMSC351", "MATH461"],
  "CMSC460": ["CMSC422"]
}

# add the prerequisites to the course objects
for course in courses:
  prereqs = course_prerequisites.get(course.course_id, [])
  # find the course in courses that matches the prereq course_id
  for prereq in prereqs:
    prereq_course_found = next((c for c in courses if c.course_id == prereq), None)
    if prereq_course_found:
      course.prerequisites.append(prereq_course_found)


# GRAD PLAN BUILDING

# assigning semester values
from collections import defaultdict

def assign_semesters(courses):
    # Create a graph representation of the courses and their prerequisites
    graph = defaultdict(list)
    in_degree = {course.course_id: 0 for course in courses}
    
    for course in courses:
        for prereq in course.prerequisites:
            graph[prereq.course_id].append(course.course_id)
            in_degree[course.course_id] += 1
    
    # Initialize a queue with courses that have no prerequisites
    queue = [course.course_id for course in courses if in_degree[course.course_id] == 0]
    
    semester = 1
    semester_assignments = {}
    
    while queue:
        current_semester_courses = []
        
        for _ in range(len(queue)):
            course_id = queue.pop(0)
            semester_assignments[course_id] = semester
            
            for neighbor in graph[course_id]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    current_semester_courses.append(neighbor)
        
        queue.extend(current_semester_courses)
        semester += 1
    
    # Assign the calculated semester numbers to the course objects
    for course in courses:
        course.semester = semester_assignments.get(course.course_id, 0)

# Call the function to assign semesters
assign_semesters(courses)

from object_classes import GraduationPlan
plan = GraduationPlan(courses)

from draw_plan import create_prerequisite_diagram
create_prerequisite_diagram(plan)
