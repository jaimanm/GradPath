from typing import List, Dict

class Course:
  def __init__(self, name: str, semester: int = None, prerequisites: List['Course'] = None, completed: bool = False):
    """
    Initialize a Course with a name, semester, and optional prerequisites.
    
    Parameters:
    name (str): The name of the course.
    semester (int): The semester in which the course is offered. set to None if value not given
    prerequisites (List[Course], optional): A list of prerequisite courses. Defaults to an empty list.
    completed (bool, optional): A boolean indicating whether the course has been completed. Defaults to False.
    """
    self.name: str = name
    self.semester: int = semester
    self.prerequisites: List['Course'] = prerequisites or []
    self.completed = completed

  def set_completed(self, completed: bool) -> None:
    """
    Set the completed status of the course.
    
    Parameters:
    completed (bool): A boolean indicating whether the course has been completed.
    """
    self.completed = completed

  def add_prerequisite(self, course: 'Course') -> None:
    """
    Add a prerequisite course to the list of prerequisites.
    
    Parameters:
    course (Course): The course to be added as a prerequisite.
    """
    self.prerequisites.append(course)

  def __repr__(self) -> str:
    """
    Return a string representation of the Course.
    
    Returns:
    str: A string representation of the course.
    """
    prerequisites_str = ""
    if self.prerequisites:
      prerequisites_str = ", Prerequisites: [" + ", ".join([course.name for course in self.prerequisites]) + "]"
    return f"\nCourse({self.name}, Semester {self.semester}{prerequisites_str})"

class GraduationPlan:
  def __init__(self, courses: List[Course] = None):
    """
    Initialize a GraduationPlan with a list of courses and an empty dictionary for semesters.
    
    Parameters:
    courses (List[Course], optional): A list of courses to initialize the plan with. Defaults to an empty list.
    """
    self.semesters: Dict[int, List[Course]] = {}
    self.courses: List[Course] = courses if courses is not None else []

  def add_course(self, course: Course) -> None:
    """
    Add a course to the GraduationPlan.
    
    Parameters:
    course (Course): The course to be added.
    """
    self.courses.append(course)

  def __repr__(self) -> str:
    """
    Return a string representation of the GraduationPlan.
    
    Returns:
    str: A string representation of the graduation plan.
    """
    return f"GraduationPlan({self.courses})"
