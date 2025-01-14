import networkx as nx
import matplotlib.pyplot as plt
from object_classes import GraduationPlan
import textwrap


def create_prerequisite_diagram(plan: GraduationPlan) -> None:
    G = nx.DiGraph()
    
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
    
    # Position nodes by semester
    for semester, courses in semester_groups.items():
        y_spacing = 2.0 / (len(courses) + 1)
        for i, course in enumerate(courses, 1):
            x = semester * 4
            y = -i * y_spacing * 3
            pos[course] = (x, y)

    
    plt.figure(figsize=(20, 15))
    
    # Draw nodes
    nx.draw_networkx_nodes(G, pos,
                          node_color=['lightgray' if course.completed else 'lightblue' for course in G.nodes()],
                          node_size=2800,
                          node_shape='o')
    
    # Draw edges with adjusted connection style and margins
    nx.draw_networkx_edges(G, pos,
                          edge_color='gray',
                          arrows=True,
                          arrowsize=20,
                          connectionstyle='arc3,rad=0.3',
                          min_source_margin=27,
                          min_target_margin=27)
    
    # Draw labels for the nodes
    nx.draw_networkx_labels(G, pos,
                       labels={course: textwrap.fill(course.name, width=15) for course in G.nodes()},
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