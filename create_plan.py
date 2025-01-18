import textwrap
import networkx as nx
import matplotlib.pyplot as plt
from draw_plan import create_prerequisite_diagram
from object_classes import Course, GraduationPlan

# Create courses (semester 1)
cmsc131 = Course("CMSC131", 1, completed=True)
math141 = Course("MATH141", 1, completed=True)
math140 = Course("MATH140", 1, completed=True)
cmsc132 = Course("CMSC132", 1, completed=True, prerequisites=[cmsc131])

# Create courses (semester 2)
cmsc250 = Course("CMSC250", 2, completed=True, prerequisites=[cmsc131, math141])
stat400 = Course("STAT400", 2, completed=True, prerequisites=[math141])

# Create courses (semester 3)
math461 = Course("MATH461", 3, prerequisites=[cmsc250])
cmsc216 = Course("CMSC216", 3, prerequisites=[cmsc132])

# Create courses (semester 4)
cmsc330 = Course("CMSC330", 4, prerequisites=[cmsc216, math461])
cmsc351 = Course("CMSC351", 4, prerequisites=[cmsc216])
cmsc320 = Course("CMSC320", 4, prerequisites=[math140, stat400])

# Create courses (semester 5)
cmsc421 = Course("CMSC421", 5, prerequisites=[cmsc330])
cmsc422 = Course("CMSC422", 5, prerequisites=[cmsc330, cmsc351])
cmsc4xx_1 = Course("CMSC4XX SPECIALIZATION", 5)

# Create courses (semester 6)
cmsc4xx_2 = Course("CMSC4XX SPECIALIZATION", 6)
ml_elective1 = Course("ML ELECTIVE", 6)
ml_elective2 = Course("ML ELECTIVE", 6)

# Create courses (semester 7)
upper_level1 = Course("UPPER LEVEL VERIFICATION", 7)
upper_level2 = Course("UPPER LEVEL VERIFICATION", 7)
upper_level3 = Course("UPPER LEVEL VERIFICATION", 7)


# Create graduation plan
plan = GraduationPlan()
all_courses = [cmsc131, math141, math140, cmsc132, cmsc250, stat400, 
               math461, cmsc216, cmsc330, cmsc351, cmsc320, cmsc421, 
               cmsc422, cmsc4xx_1, cmsc4xx_2, ml_elective1, ml_elective2,
               upper_level1, upper_level2, upper_level3]

plan.courses = all_courses

# Draw the diagram
create_prerequisite_diagram(plan)
