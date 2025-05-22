from matplotlib import transforms
import networkx as nx
import matplotlib.pyplot as plt
from utils.object_classes import GraduationPlan
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
    # Close any existing plots
    plt.close('all')
    
    # Create new diagram
    G = nx.DiGraph()
    
    if not plan.courses:  # If plan is empty, just create empty diagram
        fig = plt.figure(figsize=(15, 10))
        plt.title("Course Prerequisite Diagram", pad=50)
        plt.axis('off')
        fig.canvas.toolbar.pan()
        plt.draw()
        return

    minimize_crossings_within_semester(plan.courses)

    # Create a color palette for semesters
    colors = plt.cm.Set3(np.linspace(0, 1, max(course.semester for course in plan.courses)))
    
    # Add nodes and edges
    for course in plan.courses:
        G.add_node(course, semester=course.semester)
        for prereq in course.prerequisites:
            if prereq in plan.courses:
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

    fig = plt.figure(figsize=(15, 10))
    plt.title("Course Prerequisite Diagram", pad=50)
    ax = plt.gca()

    # Draw nodes and store the scatter plot object
    nodes = nx.draw_networkx_nodes(G, pos,
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
    
    # Add semester separators and labels
    max_semester = max(course.semester for course in plan.courses)
    for semester in range(max_semester + 1):
        # Draw vertical separator line
        plt.axvline(x=semester * 4 + 2,
                color='black',
                linestyle=':',
                alpha=0.3)
        
        # Add semester label between dividers using blended transform
        if semester > 0:
            ax = plt.gca()
            trans = transforms.blended_transform_factory(ax.transData, ax.transAxes)
            ax.text(semester * 4,  # x position in data coordinates
                    0.98,  # y position in axes coordinates
                    f"Semester {semester}",
                    horizontalalignment='center',
                    verticalalignment='bottom',
                    fontsize=12,
                    fontweight='bold',
                    transform=trans,
                    bbox=dict(facecolor='white', edgecolor='none', alpha=0.7))
    
    # Create annotation object but make it invisible
    annot = ax.annotate("", 
                       xy=(0,0), 
                       xytext=(20,20),
                       textcoords="offset points",
                       bbox=dict(boxstyle="round", fc="white", alpha=0.8),
                       arrowprops=dict(arrowstyle="->"),)
    annot.set_visible(False)
    
    def update_annot(ind, nodes):
        # Get the course object for the hovered node
        node_list = list(G.nodes())
        course = node_list[ind["ind"][0]]
        
        # Get position
        pos = nodes.get_offsets()[ind["ind"][0]]
        annot.xy = pos
        
        # Create hover text with course information and wrap text
        text = textwrap.fill(f"Course: {course.course_id}", width=30) + "\n"
        text += textwrap.fill(f"Semester: {course.semester}", width=30) + "\n"
        text += textwrap.fill(f"Credits: {course.credits}", width=30) + "\n"
        if course.prerequisites:
            prereq_text = f"Prerequisites: {", ".join([p.course_id for p in course.prerequisites])}"
            text += textwrap.fill(prereq_text, width=50) + "\n"
        
        text += textwrap.fill(f"Description: {course.description}", width=50)
        annot.set_text(text)

    def hover(event):
        if event.inaxes == ax:
            cont, ind = nodes.contains(event)
            if cont:
                annot.set_visible(True)
                update_annot(ind, nodes)
                fig.canvas.draw_idle()
            else:
                if annot.get_visible():
                    annot.set_visible(False)
                    fig.canvas.draw_idle()

    # Add instruction text
    instruction_text = ax.text(0.5, 0.02, 
                             "Use left click to pan, right click to zoom",
                             horizontalalignment='center',
                             verticalalignment='bottom',
                             transform=ax.transAxes,
                             bbox=dict(facecolor='white', edgecolor='black', alpha=0.8),
                             zorder=1000)

    def on_mouse_click(event):
        if event.button in [1, 3]:  # Left click (1) or right click (3)
            instruction_text.set_visible(False)
            fig.canvas.draw_idle()

    fig.canvas.mpl_connect("motion_notify_event", hover)
    fig.canvas.mpl_connect("button_press_event", on_mouse_click)

    plt.axis('off')
    plt.tight_layout()
    plt.subplots_adjust(left=0.1, right=0.9, top=0.9, bottom=0.1)  # Adjust the margins
    fig.canvas.toolbar.pan()
    plt.draw()

def create_cytoscape_diagram(plan: GraduationPlan) -> None:
    minimize_crossings_within_semester(plan.courses)

    # Prepare data for cytoscape.js
    elements = []
    for course in plan.courses:
        elements.append({
            'data': {'id': course.course_id, 'label': course.course_id}
        })
        for prereq in course.prerequisites:
            if prereq in plan.courses:
                elements.append({
                    'data': {'source': prereq.course_id, 'target': course.course_id}
                })

    # Return the serialized data
    return plan.to_json()