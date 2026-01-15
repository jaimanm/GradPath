// Pastel Colors for Semesters
const SEMESTER_COLORS = [
    '#FFB3BA', // Semester 1: Pastel Red/Pink
    '#FFDFBA', // Semester 2: Pastel Orange
    '#FFFFBA', // Semester 3: Pastel Yellow
    '#BAFFC9', // Semester 4: Pastel Green
    '#BAE1FF', // Semester 5: Pastel Blue
    '#E1BAFF', // Semester 6: Pastel Purple
    '#FFBAE1', // Semester 7: Pastel Pink
    '#C4FAF8'  // Semester 8: Pastel Cyan
];

// Darker Stroke Colors for Edges/Borders (Improved Visibility)
const SEMESTER_STROKE_COLORS = [
    '#E05A6D', // Darker Red
    '#F39C12', // Darker Orange
    '#D4C400', // Darker Yellow (Distinct from Orange)
    '#2ECC71', // Darker Green
    '#3498DB', // Darker Blue
    '#9B59B6', // Darker Purple
    '#E91E63', // Darker Pink
    '#1ABC9C'  // Darker Cyan
];

const cy = cytoscape({
    container: document.getElementById('cy'),
    autoungrabify: true, // User cannot grab/move nodes
    style: [
        {
            selector: 'node.course',
            style: {
                'label': 'data(label)',
                'text-valign': 'center',
                'text-halign': 'center',
                'background-color': 'data(color)',
                'border-width': 2,
                'border-color': '#888',
                'width': '100px',
                'height': '60px',
                'shape': 'round-rectangle',
                'font-size': '14px',
                'font-weight': 'bold',
                'color': '#333'
            }
        },
        {
            selector: 'edge.course-edge',
            style: {
                'width': 4,
                'line-color': 'data(color)',
                'target-arrow-color': 'data(color)',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'opacity': 1.0
            }
        },
        {
            selector: '.semester-header',
            style: {
                'label': 'data(label)',
                'background-opacity': 0,
                'border-width': 0,
                'font-size': '20px',
                'font-weight': 'bold',
                'color': '#555',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': '200px',
                'height': '40px'
            }
        },
        {
            selector: '.highlighted',
            style: {
                'background-color': '#e1f0ff',
                'line-color': '#007aff',
                'target-arrow-color': '#007aff',
                'transition-property': 'background-color, line-color, target-arrow-color',
                'transition-duration': '0.5s'
            }
        },
        {
            selector: '.divider-anchor',
            style: {
                'width': 1,
                'height': 1,
                'opacity': 0,
                'events': 'no'
            }
        },
        {
            selector: '.divider-edge',
            style: {
                'width': 2,
                'line-style': 'dashed',
                'line-color': '#d1d5db',
                'line-dash-pattern': [6, 4],
                'events': 'no',
                'curve-style': 'straight',
                'target-arrow-shape': 'none'
            }
        }
    ],
    layout: {
        name: 'preset' // We will calculate positions manually
    }
});

// State
let addedCourses = new Set();

// DOM Elements
const selectEl = document.getElementById('course-select');
const addBtn = document.getElementById('add-btn');
const clearBtn = document.getElementById('clear-btn');
const emptyState = document.getElementById('empty-state');

function updateEmptyState() {
    // Check if there are any ACTUAL courses
    const hasCourses = cy.nodes('.course').length > 0;
    
    if (hasCourses) {
        emptyState.style.display = 'none';
        cy.container().style.opacity = 1;
    } else {
        emptyState.style.display = 'flex';
        cy.container().style.opacity = 0; // Hide graph to keep it clean
    }
}

// Populate Dropdown
function updateDropdown() {
    // Save current selection if possible, though usually we want to reset
    const currentSelection = selectEl.value;
    
    // Clear existing options
    selectEl.innerHTML = '<option value="" disabled selected>Select a course...</option>';
    
    // Get currently active courses
    const activeIds = new Set(cy.nodes('.course').map(n => n.id()));

    const sortedIds = DROPDOWN_OPTIONS.sort();
    sortedIds.forEach(id => {
        // Only add if not already in graph
        if (!activeIds.has(id)) {
            const info = COURSE_CATALOG[id];
            const name = info ? info.name : id;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${id}: ${name}`;
            selectEl.appendChild(option);
        }
    });
}


// Logic to recursively finding prerequisites
function getFullPrereqTree(courseId, tree = new Set()) {
    if (tree.has(courseId)) return tree;
    tree.add(courseId);

    const prereqs = PREREQUISITE_RULES[courseId] || [];
    prereqs.forEach(pId => {
        getFullPrereqTree(pId, tree);
    });
    
    return tree;
}

// Topological Sort for Semester Assignment
function calculateSemesters(courseIds) {
    const graph = {};
    const inDegree = {};
    
    // Initialize
    courseIds.forEach(id => {
        graph[id] = [];
        inDegree[id] = 0;
    });

    // Build Graph from active courses
    courseIds.forEach(id => {
        const prereqs = PREREQUISITE_RULES[id] || [];
        prereqs.forEach(pId => {
            if (courseIds.has(pId)) {
                // Direction: Prereq -> Course
                graph[pId].push(id);
                inDegree[id]++;
            }
        });
    });

    // Queue for courses with 0 prerequisites (roots)
    const queue = [];
    courseIds.forEach(id => {
        if (inDegree[id] === 0) queue.push(id);
    });

    const semesterMap = {};
    let semester = 1;

    while (queue.length > 0) {
        const levelSize = queue.length;
        
        for (let i = 0; i < levelSize; i++) {
            const current = queue.shift();
            semesterMap[current] = semester;

            if (graph[current]) {
                graph[current].forEach(neighbor => {
                    inDegree[neighbor]--;
                    if (inDegree[neighbor] === 0) {
                        queue.push(neighbor);
                    }
                });
            }
        }
        semester++;
    }

    return semesterMap;
}

// Layout Calculation
function applyLayout() {
    const activeCourses = new Set(cy.nodes('.course').map(n => n.id()));
    if (activeCourses.size === 0) return;

    const semesterMap = calculateSemesters(activeCourses);
    
    // Layout: Minimize Crossings (Barycentric Heuristic)
    // 1. Group by semester first
    const semesterGroups = {};
    Object.entries(semesterMap).forEach(([id, sem]) => {
        if (!semesterGroups[sem]) semesterGroups[sem] = [];
        semesterGroups[sem].push(id);
    });

    const maxSem = Math.max(...Object.values(semesterMap));
    const nodeYIndices = {}; // map id -> vertical index (0, 1, 2...)

    // 2. Iterate semesters to sort
    for (let sem = 1; sem <= maxSem; sem++) {
        if (!semesterGroups[sem]) continue;
        
        let courses = semesterGroups[sem];

        if (sem === 1) {
            // Semester 1: Sort Alphabetically (or by some other logic)
            courses.sort();
        } else {
            // Successive Semesters: Sort by average position of prerequisites
            courses.sort((a, b) => {
                const getAvgPrereqY = (courseId) => {
                    const prereqs = PREREQUISITE_RULES[courseId] || [];
                    // Filter for prereqs that are currently in the graph
                    const activePrereqs = prereqs.filter(p => activeCourses.has(p) && nodeYIndices[p] !== undefined);
                    
                    if (activePrereqs.length === 0) return 9999; // No prereqs? Push to bottom (inf)

                    const sumY = activePrereqs.reduce((sum, pId) => sum + nodeYIndices[pId], 0);
                    return sumY / activePrereqs.length;
                };

                const scoreA = getAvgPrereqY(a);
                const scoreB = getAvgPrereqY(b);
                
                // Stable sort fallback
                if (Math.abs(scoreA - scoreB) < 0.01) return a.localeCompare(b);
                return scoreA - scoreB;
            });
        }

        // Assign Indices for this semester
        courses.forEach((id, idx) => {
            nodeYIndices[id] = idx;
        });
    }

    // 3. Apply Positions
    const colWidth = 200;
    const rowHeight = 90;
    const startX = 100;
    const startY = 100;

    cy.batch(() => {
        Object.entries(semesterGroups).forEach(([sem, courses]) => {
             // Center the semester vertically
             // Total height of this column = courses.length * rowHeight
             // We want to align the "center" of this column with a global center?
             // The Python script aligns center to center.
             // Simpler approach: Just center them relative to the MAX rows in graph.
             
             // However, to keep it simple and consistent with previous UI:
             // Just start from startY.
             // Or, better: Center it like the Python script does:
             // start_y = total_height / 2.
             
             // Let's stick to simple top-down for now, just ordered correctly.
             // The existing logic used startY + idx * rowHeight.
            
             courses.forEach((id, idx) => {
                const node = cy.$id(id);
                node.position({
                    x: startX + (sem - 1) * colWidth,
                    y: startY + idx * rowHeight
                });
            });
        });

        // Assign Colors based on Semester
        activeCourses.forEach(id => {
            const sem = semesterMap[id] || 1;
            const color = SEMESTER_COLORS[(sem - 1) % SEMESTER_COLORS.length];
            const stroke = SEMESTER_STROKE_COLORS[(sem - 1) % SEMESTER_STROKE_COLORS.length];
            
            const node = cy.$id(id);
            node.data('color', color);
            node.data('strokeColor', stroke);
        });

        // Assign Edge Colors and Curve Logic
        cy.edges().forEach(edge => {
            // Skip structural edges
            if (edge.hasClass('divider-edge')) return;

            const sourceId = edge.source().id();
            const targetId = edge.target().id();
            
            // 1. Color Logic (Match Source Stroke)
            const sourceStroke = cy.$id(sourceId).data('strokeColor');
            if (sourceStroke) {
                edge.data('color', sourceStroke);
            }

            // 2. Curve/Routing Logic (Matching Python Script "arc3, rad=0.3")
            // Apple curvature to ALL edges based on distance
            const sourceInfo = cy.$id(sourceId);
            const targetInfo = cy.$id(targetId);
            
            // We need positions. Since we just batch-updated them, we can access them.
            // Note: In batch, position() might return old values if not careful, 
            // but since we updated them explicitly in this batch, we can use the values we calculated 
            // or just read from the node model (which holds the new pos).
            const p1 = sourceInfo.position();
            const p2 = targetInfo.position();

            if (p1 && p2) {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Python script uses rad=0.3. This roughly corresponds to a control point offset 
                // proportional to distance.
                // We use a factor (e.g., 0.15 or 0.2) to simulate this arc.
                // Positive distance curves "Clockwise" (Down for Left->Right).
                
                if (distance > 0) {
                     edge.style({
                        'curve-style': 'unbundled-bezier',
                        'control-point-distances': [distance * 0.15], 
                        'control-point-weights': [0.5]
                    });
                }
            }
        });
    });
    cy.fit(50);
    return semesterMap;
}
// Add Course Handler
addBtn.addEventListener('click', () => {
    const selectedId = selectEl.value;
    console.log("Add Course Clicked. Selected:", selectedId);
    if (!selectedId) return;

    // 1. Calculate full dependency tree for this selection
    const requiredCourses = getFullPrereqTree(selectedId);
    console.log("Required Courses found:", Array.from(requiredCourses));

    // 2. Add any missing nodes/edges to Cytoscape
    let addedCount = 0;
    cy.batch(() => {
        // Pass 1: Add all Nodes first
        requiredCourses.forEach(id => {
            if (cy.$id(id).length === 0) {
                // Add Node
                const info = COURSE_CATALOG[id];
                const label = id; 
                cy.add({
                    group: 'nodes',
                    classes: 'course', // Tag as course
                    data: { 
                        id: id,
                        label: label 
                    }
                });
                addedCount++;
            }
        });

        // Pass 2: Add all Edges
        requiredCourses.forEach(id => {
            const prereqs = PREREQUISITE_RULES[id] || [];
            prereqs.forEach(pId => {
                if (requiredCourses.has(pId)) {
                    // Check if edge exists
                    const edgeId = `${pId}-${id}`;
                    if (cy.$id(edgeId).length === 0) {
                        cy.add({
                            group: 'edges',
                            classes: 'course-edge', // Tag as course edge
                            data: {
                                id: edgeId,
                                source: pId,
                                target: id
                            }
                        });
                    }
                }
            });
        });
    });
    console.log(`Added ${addedCount} new nodes. Total nodes: ${cy.nodes().length}`);

    // 3. Re-calculate layout for ALL nodes
    try {
        const semesterMap = applyLayout(); // Update applyLayout to return the map
        console.log("Layout applied.");
        
        // Calculate max rows for divider height
        const semesters = {};
        let maxSem = 0;
        let maxRows = 0;
        
        Object.entries(semesterMap).forEach(([id, sem]) => {
            if (!semesters[sem]) semesters[sem] = [];
            semesters[sem].push(id);
            maxSem = Math.max(maxSem, sem);
        });
        
        Object.values(semesters).forEach(list => {
            maxRows = Math.max(maxRows, list.length);
        });

        // Basic Grid Params (must match applyLayout)
        const colWidth = 200;
        const rowHeight = 90;
        const startX = 100;
        const startY = 100;
        
        // Calculate Divider Geometry
        // Top of nodes: startY - rowHeight/2 (approx node height is 60, so this gives margin)
        // Bottom of nodes: startY + (maxRows-1)*rowHeight + rowHeight/2
        // Let's ensure dividers cover the full vertical space + some padding
        const totalHeight = Math.max(maxRows * rowHeight, 600); // Minimum height for aesthetics
        const centerY = startY + ((maxRows - 1) * rowHeight) / 2;
        const headerY = startY - 100; // Position above the nodes

        cy.batch(() => {
            // Remove old headers and dividers
            cy.nodes('.semester-header').remove();
            cy.nodes('.semester-divider').remove(); // Legacy cleanup
            cy.elements('.divider-anchor').remove();
            cy.elements('.divider-edge').remove();

            for (let i = 1; i <= maxSem; i++) {
                const xPos = startX + (i - 1) * colWidth;
                
                // Add Header Node
                cy.add({
                    group: 'nodes',
                    classes: 'semester-header',
                    data: { 
                        id: `sem_header_${i}`, 
                        label: `Semester ${i}` 
                    },
                    position: { x: xPos, y: headerY },
                    locked: true,
                    selectable: false,
                    grabbable: false
                });

                // Add Divider (between this semester and next)
                if (i < maxSem) {
                    const divX = xPos + (colWidth / 2);
                    const topY = headerY - 20;
                    const bottomY = startY + (maxRows * rowHeight) + 20;

                    // Anchor Top
                    cy.add({
                        group: 'nodes',
                        classes: 'divider-anchor',
                        data: { id: `div_anc_top_${i}` },
                        position: { x: divX, y: topY },
                        locked: true,
                        grabbable: false,
                        selectable: false
                    });
                    
                    // Anchor Bottom
                    cy.add({
                        group: 'nodes',
                        classes: 'divider-anchor',
                        data: { id: `div_anc_bot_${i}` },
                        position: { x: divX, y: bottomY },
                        locked: true,
                        grabbable: false,
                        selectable: false
                    });
                    
                    // Dotted Edge
                    cy.add({
                        group: 'edges',
                        classes: 'divider-edge',
                        data: {
                            id: `sem_divider_${i}`,
                            source: `div_anc_top_${i}`,
                            target: `div_anc_bot_${i}`
                        }
                    });
                }
            }
        });
        // Smart Zoom
        cy.fit(50); // First fit to see everything
        if (cy.zoom() > 1.2) {
            cy.zoom(1.2);
            cy.center();
        }

        // Update dropdown to remove added courses
        updateDropdown();
        updateEmptyState();
        
    } catch (e) {
        console.error("Layout Error:", e);
    }
});

// Clear Handler
clearBtn.addEventListener('click', () => {
    cy.elements().remove();
    selectEl.value = "";
    updateDropdown(); // Reset dropdown
    updateEmptyState();
});

// Init
updateDropdown();
updateEmptyState();

// Tooltip Logic
const tooltip = document.getElementById('tooltip');

cy.on('mouseover', 'node', (event) => {
    const node = event.target;
    // Skip if it's a structural node (header/divider)
    if (node.hasClass('semester-header') || node.hasClass('semester-divider')) return;

    const courseId = node.id();
    const info = COURSE_CATALOG[courseId];

    if (info) {
        tooltip.innerHTML = `
            <h3>${courseId}: ${info.name}</h3>
            <div class="meta">Credits: ${info.credits}</div>
            <p>${info.description || 'No description available.'}</p>
        `;
        tooltip.style.display = 'block';
    }
});

cy.on('mousemove', (event) => {
    // Move tooltip with mouse if it is visible
    if (tooltip.style.display === 'block') {
        const padding = 15; // Offset from mouse
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        const x = event.originalEvent.clientX;
        const y = event.originalEvent.clientY;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;

        let left = x + padding;
        let top = y + padding;

        // Flip to left if overflowing right
        if (left + tooltipWidth > winWidth) {
            left = x - tooltipWidth - padding;
        }

        // Flip to top if overflowing bottom
        if (top + tooltipHeight > winHeight) {
            top = y - tooltipHeight - padding;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }
});

cy.on('mouseout', 'node', () => {
    tooltip.style.display = 'none';
});
