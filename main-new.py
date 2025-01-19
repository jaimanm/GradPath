from utils.dropdown import create_control_window
from utils.object_classes import GraduationPlan


course_options = [
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
plan = GraduationPlan()
create_control_window(plan, course_options)