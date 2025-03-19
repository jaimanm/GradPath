<script>
    import cytoscape from 'cytoscape';
    import { onMount } from 'svelte';

    let planData;

    // read the json file into planData
    


    let cy;

    // Initialize Cytoscape
    function initCytoscape() {
        const elements = [];

        // Prepare elements for cytoscape
        planData.courses.forEach(course => {
            elements.push({ data: { id: course.id, label: course.id } });
            course.prerequisites.forEach(prereq => {
                elements.push({ data: { source: prereq, target: course.id } });
            });
        });

        cy = cytoscape({
            container: document.getElementById('cy'),
            elements: elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#6FB1FC',
                        'label': 'data(label)'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc'
                    }
                }
            ],
            layout: {
                name: 'cose'
            }
        });
    }

    onMount(() => {
        initCytoscape();
    });
</script>

<style>
    #cy {
        width: 100%;
        height: 600px;
        border: 1px solid black;
    }
</style>

<div id="cy"></div>
