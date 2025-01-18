import networkx as nx
import matplotlib.pyplot as plt
from .object_classes import GraduationPlan
import textwrap

def create_prerequisite_diagram(plan: GraduationPlan) -> None:
    # Create single figure instance
    fig, ax = plt.subplots(figsize=(20, 15))
    
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
    
    # Draw nodes
    nx.draw_networkx_nodes(G, pos,
                          node_color=['lightgray' if course.completed else 'lightblue' for course in G.nodes()],
                          node_size=2800,
                          node_shape='o',
                          ax=ax)
    
    # Draw edges with adjusted connection style and margins
    nx.draw_networkx_edges(G, pos,
                          edge_color='gray',
                          arrows=True,
                          arrowsize=20,
                          connectionstyle='arc3,rad=0.3',
                          min_source_margin=27,
                          min_target_margin=27,
                          ax=ax)
    
    # Draw labels for the nodes
    nx.draw_networkx_labels(G, pos,
                       labels={course: textwrap.fill(course.course_id, width=15) for course in G.nodes()},
                       font_size=10,
                       font_color='black',
                       font_weight='bold',
                       font_family='sans-serif',
                       verticalalignment='center',
                       ax=ax)
    
    # Add semester separators
    max_semester = max(course.semester for course in plan.courses)
    for semester in range(1, max_semester + 2):
        ax.axvline(x=semester * 4 - 2, 
                  color='black',
                  linestyle=':',
                  alpha=0.3)
    
    ax.set_title("Course Prerequisite Diagram")
    ax.axis('off')
    
    def on_click(event):
        if event.inaxes != ax:
            return
        
        # Find closest node to click
        click_pos = (event.xdata, event.ydata)
        min_dist = float('inf')
        clicked_course = None
        
        for course, node_pos in pos.items():
            dist = ((click_pos[0] - node_pos[0])**2 + 
                (click_pos[1] - node_pos[1])**2)**0.5
            if dist < min_dist:
                min_dist = dist
                clicked_course = course
        
        if min_dist < 1.0:  # Within node radius
            # Remove existing course info annotations
            for txt in ax.texts:
                if hasattr(txt, 'is_course_info'):
                    txt.remove()
            
            # Create info text
            info = f"""
            Course: {clicked_course.course_id}
            Credits: {clicked_course.credits}
            Semester: {clicked_course.semester}
            Prerequisites: {', '.join(p.course_id for p in clicked_course.prerequisites)}
            """
            # Add new annotation
            text = ax.text(0.85, 0.95, info,
                        transform=ax.transAxes,
                        bbox=dict(facecolor='white', alpha=0.8),
                        verticalalignment='top')
            text.is_course_info = True
            plt.draw()

    
    fig.canvas.mpl_connect('button_press_event', on_click)
    plt.tight_layout()
    plt.show()


# def create_prerequisite_diagram(plan: GraduationPlan) -> None:
#     G = nx.DiGraph()
    
#     # Add nodes and edges
#     for course in plan.courses:
#         G.add_node(course, semester=course.semester)
#         for prereq in course.prerequisites:
#             G.add_edge(prereq, course)
    
#     # Create layout
#     pos = {}
#     semester_groups = {}
    
#     # Group courses by semester
#     for course in plan.courses:
#         if course.semester not in semester_groups:
#             semester_groups[course.semester] = []
#         semester_groups[course.semester].append(course)
    
#     # Position nodes by semester
#     for semester, courses in semester_groups.items():
#         y_spacing = 2.0 / (len(courses) + 1)
#         for i, course in enumerate(courses, 1):
#             x = semester * 4
#             y = -i * y_spacing * 3
#             pos[course] = (x, y)

    
#     plt.figure(figsize=(20, 15))
    
#     # Draw nodes
#     nx.draw_networkx_nodes(G, pos,
#                           node_color=['lightgray' if course.completed else 'lightblue' for course in G.nodes()],
#                           node_size=2800,
#                           node_shape='o')
    
#     # Draw edges with adjusted connection style and margins
#     nx.draw_networkx_edges(G, pos,
#                           edge_color='gray',
#                           arrows=True,
#                           arrowsize=20,
#                           connectionstyle='arc3,rad=0.3',
#                           min_source_margin=27,
#                           min_target_margin=27)
    
#     # Draw labels for the nodes
#     nx.draw_networkx_labels(G, pos,
#                        labels={course: textwrap.fill(course.course_id, width=15) for course in G.nodes()},
#                        font_size=10,
#                        font_color='black',
#                        font_weight='bold',
#                        font_family='sans-serif',
#                        verticalalignment='center')
    
#     # Add semester separators
#     max_semester = max(course.semester for course in plan.courses)
#     for semester in range(1, max_semester + 2):
#         plt.axvline(x=semester * 4 - 2, 
#                    color='black',
#                    linestyle=':',
#                    alpha=0.3)
    
#     plt.title("Course Prerequisite Diagram")
#     plt.axis('off')
#     plt.tight_layout()
#     plt.show()