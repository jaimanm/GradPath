import textwrap
import networkx as nx
import matplotlib.pyplot as plt
from draw_plan import create_prerequisite_diagram
from object_classes import Course, GraduationPlan

# Create courses (semester 1)
cmsc131 = Course("CMSC131", 1)
math141 = Course("MATH141", 1)
math140 = Course("MATH140", 1)
cmsc132 = Course("CMSC132", 1)

# Create courses (semester 2)
cmsc250 = Course("CMSC250", 2)
stat400 = Course("STAT400", 2)

# Create courses (semester 3)
math461 = Course("MATH461", 3)
cmsc216 = Course("CMSC216", 3)

# Create courses (semester 4)
cmsc330 = Course("CMSC330", 4)
cmsc351 = Course("CMSC351", 4)
cmsc320 = Course("CMSC320", 4)

# Create courses (semester 5)
cmsc421 = Course("CMSC421", 5)
cmsc422 = Course("CMSC422", 5)
cmsc4xx_1 = Course("CMSC4XX SPECIALIZATION", 5)

# Create courses (semester 6)
cmsc4xx_2 = Course("CMSC4XX SPECIALIZATION", 6)
ml_elective1 = Course("ML ELECTIVE", 6)
ml_elective2 = Course("ML ELECTIVE", 6)

# Create courses (semester 7)
upper_level1 = Course("UPPER LEVEL VERIFICATION", 7)
upper_level2 = Course("UPPER LEVEL VERIFICATION", 7)
upper_level3 = Course("UPPER LEVEL VERIFICATION", 7)

# Add prerequisites
cmsc132.add_prerequisite(cmsc131)
cmsc250.add_prerequisite(cmsc131)
cmsc250.add_prerequisite(math141)
stat400.add_prerequisite(math141)

cmsc216.add_prerequisite(cmsc132)
math461.add_prerequisite(cmsc250)

cmsc330.add_prerequisite(cmsc216)
cmsc330.add_prerequisite(math461)
cmsc351.add_prerequisite(cmsc216)
cmsc320.add_prerequisite(math140)
cmsc320.add_prerequisite(stat400)

cmsc421.add_prerequisite(cmsc330)
cmsc422.add_prerequisite(cmsc330)
cmsc422.add_prerequisite(cmsc351)

# Create graduation plan
plan = GraduationPlan()
all_courses = [cmsc131, math141, math140, cmsc132, cmsc250, stat400, 
               math461, cmsc216, cmsc330, cmsc351, cmsc320, cmsc421, 
               cmsc422, cmsc4xx_1, cmsc4xx_2, ml_elective1, ml_elective2,
               upper_level1, upper_level2, upper_level3]

plan.courses = all_courses

# Draw the diagram
create_prerequisite_diagram(plan)
