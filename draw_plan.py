import networkx as nx
import matplotlib.pyplot as plt
from object_classes import GraduationPlan
import textwrap
import numpy as np

def minimize_crossings_within_semester(courses):
    # First assign initial vertical positions for courses with no prerequisites
    semester_groups = {}
    for course in courses:
        if course.semester not in semester_groups:
            semester_groups[course.semester] = []
        semester_groups[course.semester].append(course)
    
    # Start with semester 1 and assign arbitrary vertical positions
    if 1 in semester_groups:
        for i, course in enumerate(semester_groups[1]):
            course.vertical_position = i
    
    # Then process remaining semesters in order
    for semester in range(2, max(semester_groups.keys()) + 1):
        if semester not in semester_groups:
            continue
            
        courses_in_semester = semester_groups[semester]
        course_positions = {}
        
        for course in courses_in_semester:
            prereq_positions = [p.vertical_position for p in course.prerequisites]
            if prereq_positions:
                course_positions[course] = sum(prereq_positions) / len(prereq_positions)
            else:
                # For courses with no prerequisites, use a default position
                course_positions[course] = float('inf')  # Place at bottom
                
        # Sort and assign new positions
        sorted_courses = sorted(courses_in_semester, 
                              key=lambda c: course_positions[c])
        for i, course in enumerate(sorted_courses):
            course.vertical_position = i

def create_prerequisite_diagram(plan: GraduationPlan) -> None:
    G = nx.DiGraph()

    minimize_crossings_within_semester(plan.courses)

    # Create a color palette for semesters
    colors = plt.cm.Set3(np.linspace(0, 1, max(course.semester for course in plan.courses)))

    
    # Add nodes and edges
    for course in plan.courses:
        G.add_node(course, semester=course.semester)
        for prereq in course.prerequisites:
            G.add_edge(prereq, course)
    
    # Create layout
    pos = {}
    semester_groups = {}
    
    # Group courses by semester
    for course in plan.courses:
        if course.semester not in semester_groups:
            semester_groups[course.semester] = []
        semester_groups[course.semester].append(course)
    
    # Position nodes by semester using vertical_position
    max_positions = {}
    for semester in semester_groups:
        max_positions[semester] = len(semester_groups[semester]) - 1

    # Calculate vertical offset for centering
    for semester, courses in semester_groups.items():
        total_height = max_positions[semester] * 3  # Using same spacing factor of 3
        start_y = total_height / 2  # Center point
        
        for course in courses:
            x = semester * 4
            # Center the vertical positions around 0
            y = start_y - (course.vertical_position * 3)
            pos[course] = (x, y)

    
    plt.figure(figsize=(20, 15))
    
    # Draw nodes
    nx.draw_networkx_nodes(G, pos,
                          node_color=['lightgray' if course.completed else 'lightblue' for course in G.nodes()],
                          node_size=2800,
                          node_shape='o')
    
    for (src, dst) in G.edges():
        nx.draw_networkx_edges(G, pos,
                            edgelist=[(src, dst)],
                            edge_color=[colors[src.semester-1]],  # Color based on source semester
                            arrows=True,
                            arrowsize=20,
                            connectionstyle='arc3,rad=0.3',
                            min_source_margin=27,
                            min_target_margin=27,
                            alpha=0.7)  # Add some transparency to make overlapping edges more visible
    # Draw labels
    nx.draw_networkx_labels(G, pos,
                       labels={course: textwrap.fill(course.course_id, width=15) for course in G.nodes()},
                       font_size=10,
                       font_color='black',
                       font_weight='bold',
                       font_family='sans-serif',
                       verticalalignment='center')
    
    # Add semester separators
    max_semester = max(course.semester for course in plan.courses)
    for semester in range(1, max_semester + 2):
        plt.axvline(x=semester * 4 - 2, 
                   color='black',
                   linestyle=':',
                   alpha=0.3)
    
    plt.title("Course Prerequisite Diagram")
    plt.axis('off')
    plt.tight_layout()
    plt.show()
