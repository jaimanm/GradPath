import json
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt
plt.ion()
from utils.draw_plan import create_prerequisite_diagram
from utils.object_classes import Course, GraduationPlan
import tkinter as tk
from tkinter import ttk

# Load prerequisites dictionary globally
with open('data/sample-prerequisites.json') as f:
    PREREQUISITES: dict[str: list[str]] = json.load(f)


def get_all_prerequisites_recursive(course: Course, visited: set = None) -> set[Course]:
    """Returns a set of all prerequisite courses (including prerequisites of prerequisites)"""
    if visited is None:
        visited = set()
    
    if course.course_id in visited:
        return set()
        
    visited.add(course.course_id)
    all_prereqs = set()
    direct_prereqs = PREREQUISITES.get(course.course_id, [])
    
    for prereq_id in direct_prereqs:
        prereq_course = Course(prereq_id)
        all_prereqs.add(prereq_course)
        all_prereqs.update(get_all_prerequisites_recursive(prereq_course, visited))
    
    return all_prereqs

def determine_semester(course: Course, existing_courses: list[Course]) -> int:
    """
    Determines appropriate semester for a course based on its prerequisites
    and existing courses in the plan
    """
    # Check if course already exists in plan
    existing_course = next((c for c in existing_courses if c.course_id == course.course_id), None)
    if existing_course:
        return existing_course.semester
    
    # Get all prerequisites for this course
    direct_prereqs = PREREQUISITES.get(course.course_id, [])
    if not direct_prereqs:
        return 1
    
    max_prereq_semester = 1
    for prereq_id in direct_prereqs:
        # Find prerequisite in existing courses
        prereq_course = next((c for c in existing_courses if c.course_id == prereq_id), None)
        if prereq_course:
            max_prereq_semester = max(max_prereq_semester, prereq_course.semester)
        else:
            # If prerequisite isn't in plan yet, recursively determine its semester
            new_prereq = Course(prereq_id)
            prereq_semester = determine_semester(new_prereq, existing_courses)
            max_prereq_semester = max(max_prereq_semester, prereq_semester)
    
    return max_prereq_semester + 1


def create_control_window(plan: GraduationPlan, available_course_ids: list[str]) -> None:
    
    control_window = tk.Tk()
    control_window.title("Course Selection")
    
    selected_course = tk.StringVar()
    
    # Keep original list of course IDs and create current options
    original_options = sorted(available_course_ids)
    current_options = original_options.copy()
    
    # Create placeholders
    DEFAULT_PLACEHOLDER = "Choose a course"
    ALL_SELECTED_PLACEHOLDER = "All courses chosen"
    
    dropdown = ttk.Combobox(control_window, 
                           textvariable=selected_course,
                           values=[DEFAULT_PLACEHOLDER] + current_options,
                           state='readonly')
    dropdown.set(DEFAULT_PLACEHOLDER)
    dropdown.pack(padx=20, pady=20)
    
    def update_dropdown_options():
        placeholder = ALL_SELECTED_PLACEHOLDER if not current_options else DEFAULT_PLACEHOLDER
        dropdown['values'] = [placeholder] + current_options
        dropdown.set(placeholder)
    
    def on_course_select(event):
        selected = selected_course.get()
        if selected in [DEFAULT_PLACEHOLDER, ALL_SELECTED_PLACEHOLDER]:
            return
        
        # Create selected course object
        selected_course_obj = Course(selected)
        
        # Get all prerequisites recursively
        all_prereqs = get_all_prerequisites_recursive(selected_course_obj)
        
        # Create a mapping of course_id to Course objects for easy lookup
        course_map = {course.course_id: course for course in plan.courses}
        
        # First add all prerequisites to the plan
        for prereq in sorted(all_prereqs, key=lambda x: len(get_all_prerequisites_recursive(x))):
            if not any(c.course_id == prereq.course_id for c in plan.courses):
                # Set prerequisites for this prerequisite course
                prereq_ids = PREREQUISITES.get(prereq.course_id, [])
                prereq.prerequisites = [course_map[pid] for pid in prereq_ids if pid in course_map]
                
                prereq.semester = determine_semester(prereq, plan.courses)
                plan.add_course(prereq)
                course_map[prereq.course_id] = prereq
        
        # Set prerequisites for the selected course
        selected_prereq_ids = PREREQUISITES.get(selected, [])
        selected_course_obj.prerequisites = [course_map[pid] for pid in selected_prereq_ids if pid in course_map]
        
        # Then add the selected course
        selected_course_obj.semester = determine_semester(selected_course_obj, plan.courses)
        plan.add_course(selected_course_obj)
        
        # Remove selected course from options
        if selected in current_options:
            current_options.remove(selected)
        update_dropdown_options()
        
        # Update diagram
        create_prerequisite_diagram(plan)
    
    def clear_selection():
        plan.courses.clear()
        current_options.clear()
        current_options.extend(original_options)
        update_dropdown_options()
        create_prerequisite_diagram(plan)
    
    clear_button = tk.Button(control_window, 
                            text="Clear Selection", 
                            command=clear_selection)
    clear_button.pack(pady=10)
    
    dropdown.bind('<<ComboboxSelected>>', on_course_select)
    
    # Create initial empty diagram
    create_prerequisite_diagram(plan)
    
    control_window.mainloop()
    plt.show()
