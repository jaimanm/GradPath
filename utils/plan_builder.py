
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
