from object_classes import *

def test_course_initialization():
  course = Course("CMSC131", 1)
  assert course.name == "CMSC131"
  assert course.semester == 1
  assert course.prerequisites == []

def test_initialization_completed_default():
  course = Course(name="Math 101")
  assert not course.completed, "Default value of completed should be False"

def test_initialization_completed_true():
  course = Course(name="Math 101", completed=True)
  assert course.completed, "Completed should be True when set during initialization"

def test_set_completed():
  course = Course(name="Math 101")
  course.set_completed(True)
  assert course.completed, "Completed should be True after calling set_completed(True)"
  course.set_completed(False)
  assert not course.completed, "Completed should be False after calling set_completed(False)"

def test_course_initialization_with_prerequisites():
  prerequisite_course = Course("MATH140", 1)
  course = Course("CMSC131", 1, prerequisites=[prerequisite_course])
  assert course.name == "CMSC131"
  assert course.semester == 1
  assert course.prerequisites == [prerequisite_course]

def test_add_prerequisite():
  course = Course("CMSC131", 1)
  prerequisite_course = Course("MATH140", 1)
  course.add_prerequisite(prerequisite_course)
  assert course.prerequisites == [prerequisite_course]

def test_course_repr():
  course = Course("CMSC131", 1)
  assert repr(course) == "\nCourse(CMSC131, Semester 1)"

def test_course_initialization_empty_name():
  course = Course("", 1)
  assert course.name == ""
  assert course.semester == 1
  assert course.prerequisites == []

def test_course_initialization_negative_semester():
  course = Course("CMSC131", -1)
  assert course.name == "CMSC131"
  assert course.semester == -1
  assert course.prerequisites == []

def test_add_multiple_prerequisites():
  course = Course("CMSC131", 1)
  prerequisite_course1 = Course("MATH140", 1)
  prerequisite_course2 = Course("ENGL101", 1)
  course.add_prerequisite(prerequisite_course1)
  course.add_prerequisite(prerequisite_course2)
  assert course.prerequisites == [prerequisite_course1, prerequisite_course2]

def test_add_duplicate_prerequisite():
  course = Course("CMSC131", 1)
  prerequisite_course = Course("MATH140", 1)
  course.add_prerequisite(prerequisite_course)
  course.add_prerequisite(prerequisite_course)
  assert course.prerequisites == [prerequisite_course, prerequisite_course]

def test_course_repr_with_prerequisites():
  prerequisite_course = Course("MATH140", 1)
  course = Course("CMSC131", 1, prerequisites=[prerequisite_course])
  assert repr(course) == "\nCourse(CMSC131, Semester 1, Prerequisites: [MATH140])"