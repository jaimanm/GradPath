import json

from utils.plan_builder import assign_semesters

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
from utils.object_classes import Course
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
assign_semesters(courses)

# FACTOR IN TRANSFER CREDITS
aps_completed = [
  "Math-Calculus BC",
  "Computer Science A",
]
exemption_exams = [
  "CMSC132"
]
ap_credits = json.load(open("data/ap-credits.json"))
for ap in aps_completed:
  # find the corresponding course
  completed_courses = ap_credits[ap]
  for course in completed_courses:
    c = next((c for c in courses if c.course_id == course), None)

    if c:
      c.completed = True
      c.semester = 1

for exam in exemption_exams:
  course = next((c for c in courses if c.course_id == exam), None)
  if course:
    course.completed = True
    course.semester = 1

from utils.object_classes import GraduationPlan
plan = GraduationPlan(courses)

from utils.draw_plan import create_prerequisite_diagram
create_prerequisite_diagram(plan)
