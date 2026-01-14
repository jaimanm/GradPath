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
    '#D4AC0D', // Darker Yellow (Goldenrod)
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
            selector: 'node',
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
            selector: 'edge',
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

// Populate Dropdown
function updateDropdown() {
    // Save current selection if possible, though usually we want to reset
    const currentSelection = selectEl.value;
    
    // Clear existing options
    selectEl.innerHTML = '<option value="" disabled selected>Select a course...</option>';
    
    // Get currently active courses
    const activeIds = new Set(cy.nodes().map(n => n.id()));

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
    const activeCourses = new Set(cy.nodes().map(n => n.id()));
    if (activeCourses.size === 0) return;

    const semesterMap = calculateSemesters(activeCourses);
    
    // Group courses by semester to assign Y positions
    const semesters = {};
    Object.entries(semesterMap).forEach(([id, sem]) => {
        if (!semesters[sem]) semesters[sem] = [];
        semesters[sem].push(id);
    });

    // Basic Grid Params
    const colWidth = 200;
    const rowHeight = 90;
    const startX = 100;
    const startY = 100;

    cy.batch(() => {
        activeCourses.forEach(id => {
            const sem = semesterMap[id] || 1; // Default to 1 if something weird
            
            // Find index in semester list for Y position
            // Sorting by ID for stability, or could use heuristics
            semesters[sem].sort(); 
            const idx = semesters[sem].indexOf(id);

            const node = cy.$id(id);
            node.position({
                x: startX + (sem - 1) * colWidth,
                y: startY + idx * rowHeight
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

        // Assign Edge Colors (Match Source Stroke)
        cy.edges().forEach(edge => {
            const sourceId = edge.source().id();
            const sourceStroke = cy.$id(sourceId).data('strokeColor');
            if (sourceStroke) {
                edge.data('color', sourceStroke);
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
            cy.nodes('.semester-divider').remove();

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
                    cy.add({
                        group: 'nodes',
                        classes: 'semester-divider',
                        data: {
                            id: `sem_divider_${i}`
                        },
                        position: { x: divX, y: centerY + (headerY - startY)/2 }, // Center vertically somewhat
                        style: {
                            'width': 2,
                            'height': totalHeight + 200, // Extend a bit more
                            'shape': 'rectangle',
                            'background-color': '#e0e0e0',
                            'border-width': 0,
                            'label': '',
                            'events': 'no' // Make it passthrough for events if possible, else lock
                        },
                        locked: true,
                        selectable: false,
                        grabbable: false
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
        
    } catch (e) {
        console.error("Layout Error:", e);
    }
});

// Clear Handler
clearBtn.addEventListener('click', () => {
    cy.elements().remove();
    selectEl.value = "";
    updateDropdown(); // Reset dropdown
});

// Init
updateDropdown();

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
