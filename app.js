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
let completedCourses = new Set();

// Logic for Completion (Recursive Two-Way Consistency)
function toggleCourseCompletion(courseId) {
    if (completedCourses.has(courseId)) {
        // Unmarking: Also unmark any COMPLETED courses that depend on this one
        // (If I haven't done A, I couldn't have done B)
        unmarkRecursive(courseId);
    } else {
        // Marking: Also mark all prerequisites
        // (If I've done B, I must have done A)
        markRecursive(courseId);
    }
    // Redraw
    applyLayout();
}

function markRecursive(id) {
    const tree = getFullPrereqTree(id);
    tree.forEach(pid => completedCourses.add(pid));
}

function unmarkRecursive(id) {
    if (!completedCourses.has(id)) return;
    
    completedCourses.delete(id);
    
    // Find dependents that are currently completed and unmark them
    // Iterate all rules to find who lists 'id' as a prerequisite
    Object.entries(PREREQUISITE_RULES).forEach(([childId, prereqs]) => {
        if (prereqs.includes(id)) {
            if (completedCourses.has(childId)) {
                unmarkRecursive(childId);
            }
        }
    });
}

// Click Handler for Completion
cy.on('tap', 'node.course', (evt) => {
    const node = evt.target;
    toggleCourseCompletion(node.id());
});

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
    const semesterMap = {};
    
    // Initialize
    courseIds.forEach(id => {
        graph[id] = [];
        inDegree[id] = 0;
        // Prioritize completed courses
        if (completedCourses.has(id)) {
            semesterMap[id] = 0;
        }
    });

    // Build Graph (Only for non-completed courses)
    courseIds.forEach(id => {
        if (completedCourses.has(id)) return; // Skip completed

        const prereqs = PREREQUISITE_RULES[id] || [];
        prereqs.forEach(pId => {
            if (courseIds.has(pId)) {
                // If prereq is completed, it is resolved.
                if (!completedCourses.has(pId)) {
                    // Only count dependency if prereq is NOT completed
                    graph[pId].push(id);
                    inDegree[id]++;
                }
            }
        });
    });

    // Queue for courses with 0 unfinished prerequisites
    const queue = [];
    courseIds.forEach(id => {
        if (!completedCourses.has(id) && inDegree[id] === 0) queue.push(id);
    });

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
    for (let sem = 0; sem <= maxSem; sem++) {
        if (!semesterGroups[sem]) continue;
        
        let courses = semesterGroups[sem];

        if (sem <= 1) {
            // Semester 0 (Completed) and 1: Sort Alphabetically
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

    // 3. Apply Positions and Visuals
    const colWidth = 200;
    const rowHeight = 90;
    const startX = 100; // Anchor for Semester 1 (Completed grows LEFT from here)
    const startY = 100;
    
    const COMPLETED_COLS_MAX_ROWS = 6;
    const numCompCourses = semesterGroups[0] ? semesterGroups[0].length : 0;
    const numCompCols = numCompCourses > 0 ? Math.ceil(numCompCourses / COMPLETED_COLS_MAX_ROWS) : 0;

    // Calculate vertical dimensions for headers/dividers
    let maxRows = 0;
    Object.entries(semesterGroups).forEach(([sem, list]) => {
        const semInt = parseInt(sem);
        let height = list.length;
        if (semInt === 0) height = Math.min(list.length, COMPLETED_COLS_MAX_ROWS);
        maxRows = Math.max(maxRows, height);
    });
    const bottomY = startY + (maxRows * rowHeight) + 20;
    const topY = startY - 120;
    const headerY = startY - 100;

    cy.batch(() => {
        // A. Position Nodes
        Object.entries(semesterGroups).forEach(([sem, courses]) => {
            const semInt = parseInt(sem);
            
            if (semInt === 0) {
                 // Completed: Grow Left
                 courses.forEach((id, idx) => {
                     const c = Math.floor(idx / COMPLETED_COLS_MAX_ROWS);
                     const r = idx % COMPLETED_COLS_MAX_ROWS;
                     // Formula: startX - (offset * colWidth). 
                     // Col 0 (leftmost) offset = numCompCols. Col N (near Sem1) offset = 1.
                     const offset = numCompCols - c; 
                     const xPos = startX - (offset * colWidth);
                     
                     cy.$id(id).position({x: xPos, y: startY + r * rowHeight});
                });
            } else {
                 // Standard Semester (Sem 1 at startX)
                 const xPos = startX + (semInt - 1) * colWidth;
                 courses.forEach((id, idx) => {
                     cy.$id(id).position({x: xPos, y: startY + idx * rowHeight});
                });
            }
        });

        // B. Colors
        activeCourses.forEach(id => {
            const sem = semesterMap[id];
            const node = cy.$id(id);
            if (completedCourses.has(id)) {
                node.data('color', '#e0e0e0');
                node.data('strokeColor', '#9e9e9e');
            } else {
                const safeSem = Math.max(1, sem);
                const color = SEMESTER_COLORS[(safeSem - 1) % SEMESTER_COLORS.length];
                const stroke = SEMESTER_STROKE_COLORS[(safeSem - 1) % SEMESTER_STROKE_COLORS.length];
                node.data('color', color);
                node.data('strokeColor', stroke);
            }
        });

        // C. Edges
        cy.edges().forEach(edge => {
            if (edge.hasClass('divider-edge')) return;
            if (completedCourses.has(edge.target().id())) {
                edge.style('display', 'none');
                return;
            } else {
                edge.style('display', 'element');
            }

            const sourceStroke = cy.$id(edge.source().id()).data('strokeColor');
            if (sourceStroke) edge.data('color', sourceStroke);

            // Curve Logic
            const p1 = edge.source().position();
            const p2 = edge.target().position();
            if (p1 && p2) {
                const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                if (distance > 0) {
                     edge.style({
                        'curve-style': 'unbundled-bezier',
                        'control-point-distances': [distance * 0.15], 
                        'control-point-weights': [0.5]
                    });
                }
            }
        });

        // D. Headers and Dividers
        cy.nodes('.semester-header').remove();
        cy.elements('.divider-anchor').remove();
        cy.elements('.divider-edge').remove();

        // D1. Completed Header
        if (numCompCols > 0) {
            // Center of Completed Block (growing Left from startX)
            // Block spans from startX - num*W to startX.
            // Center = startX - (num+1)*W/2.
            const compHeaderX = startX - ((numCompCols + 1) * colWidth) / 2;
            cy.add({
                group: 'nodes', classes: 'semester-header',
                data: { id: 'sem_header_completed', label: 'Completed' },
                position: { x: compHeaderX, y: headerY },
                locked: true, selectable: false, grabbable: false
            });
        }

        // D2. Standard Headers
        for (let i = 1; i <= maxSem; i++) {
            const xPos = startX + (i - 1) * colWidth;
            cy.add({
                group: 'nodes', classes: 'semester-header',
                data: { id: `sem_header_${i}`, label: `Semester ${i}` },
                position: { x: xPos, y: headerY },
                locked: true, selectable: false, grabbable: false
            });
        }

        // D3. Dividers
        // Divider 0: Between Completed and Sem 1.
        // Gap is between `startX - 200` (last comp col) and `startX` (Sem 1)?
        // No, Col centers are 200 apart. 
        // Last Comp Col Center: `startX - 200`. Sem 1 Center: `startX`.
        // Midpoint: `startX - 100`. (startX - colWidth/2).
        
        // Divider k (Sem k to k+1):
        // Sem k Center: `startX + (k-1)*200`.
        // Sem k+1 Center: `startX + k*200`.
        // Midpoint: `startX + (k-1)*200 + 100` = `startX + (k - 0.5)*200`.
        
        // Loop 0 to maxSem-1.
        for (let i = 0; i < maxSem; i++) {
            let divX;
            if (i === 0) {
                 // Between Completed block and Sem 1
                 // Always at startX - colWidth/2 (Left edge of Sem 1)
                 divX = startX - (colWidth / 2);
            } else {
                 // Between Sem i and Sem i+1
                 // i=1 (gap Sem 1-2). divX = startX + 100. (Right edge of Sem 1).
                 // Formula: startX + (i-1)*colWidth + colWidth/2.
                 divX = startX + (i - 1) * colWidth + (colWidth / 2);
            }
            // Only add Divider 0 if we have completed cols?
            // "Divider between completed section and Sem 1". Yes.
            // If numCompCols=0, do we want a divider to the left of Sem 1? 
            // Maybe not.
            if (i === 0 && numCompCols === 0) continue; 
            
            cy.add({
                group: 'nodes', classes: 'divider-anchor',
                data: { id: `div_anc_top_gap_${i}` },
                position: { x: divX, y: topY },
                locked: true, grabbable: false, selectable: false
            });
            cy.add({
                group: 'nodes', classes: 'divider-anchor',
                data: { id: `div_anc_bot_gap_${i}` },
                position: { x: divX, y: bottomY },
                locked: true, grabbable: false, selectable: false
            });
            cy.add({
                group: 'edges', classes: 'divider-edge',
                data: {
                    id: `sem_divider_gap_${i}`,
                    source: `div_anc_top_gap_${i}`, target: `div_anc_bot_gap_${i}`
                }
            });
        }
    });

    cy.fit(50);
    if (cy.zoom() > 1.2) {
        cy.zoom(1.2);
        cy.center();
    }
    
    updateDropdown();
    updateEmptyState();

    return semesterMap;
}
// Add Course Handler
addBtn.addEventListener('click', () => {
    const selectedId = selectEl.value;
    if (!selectedId) return;

    // 1. Calculate full dependency tree for this selection
    const requiredCourses = getFullPrereqTree(selectedId);

    // 2. Add any missing nodes/edges to Cytoscape
    cy.batch(() => {
        // Pass 1: Add all Nodes first
        requiredCourses.forEach(id => {
            if (cy.$id(id).length === 0) {
                const info = COURSE_CATALOG[id];
                const label = id; 
                cy.add({
                    group: 'nodes',
                    classes: 'course',
                    data: { 
                        id: id,
                        label: label,
                        color: '#eeeeee' // Default color to prevent warnings
                    }
                });
            }
        });

        // Pass 2: Add all Edges
        requiredCourses.forEach(id => {
            const prereqs = PREREQUISITE_RULES[id] || [];
            prereqs.forEach(pId => {
                if (requiredCourses.has(pId)) {
                    const edgeId = `${pId}-${id}`;
                    if (cy.$id(edgeId).length === 0) {
                        cy.add({
                            group: 'edges',
                            classes: 'course-edge',
                            data: {
                                id: edgeId,
                                source: pId,
                                target: id,
                                color: '#cccccc' // Default color
                            }
                        });
                    }
                }
            });
        });
    });

    // 3. Re-calculate layout for ALL nodes
    applyLayout();
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
        const isCompleted = completedCourses.has(courseId);
        const actionText = isCompleted ? "mark as Incomplete" : "mark as Completed";
        
        tooltip.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: black; font-size: 15px; font-style: italic;">
                Click to ${actionText}
            </div>
            <h3 style="margin-top: 0;">${courseId}: ${info.name}</h3>
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
