// integration starts here
// variables to keep track
let canvasHeight = 400;
let canvasWidth = 400;
let darkMode = document.body.classList.contains("dark-mode");
let currentBackground = 0;

// function for resizing
function windowResized() {
    container = document.getElementById('canvas-container');
    canvasWidth = container.getBoundingClientRect().width;
    canvasHeight = canvasWidth * (2 / 3); // square canvas
    resizeCanvas(canvasWidth, canvasHeight);
}


function draw_background() {
    // Handle dark mode background transition
    darkMode = document.body.classList.contains("dark-mode");
    if (darkMode) {
        currentBackground = lerp(currentBackground, 0, 0.1);
    } else {
        currentBackground = lerp(currentBackground, 200, 0.1);
    }

    background(currentBackground);
}

function setup() {
    // start up
    container = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(container);
    windowResized();
    // integration ends here

    node_graph = innitialize_node_graph(10);
    let vis_margin = 10;
    visualization = new node_graph_visualization(node_graph, { x: vis_margin, y: vis_margin, w: width - (vis_margin * 2), h: height - (vis_margin * 2) });
}

let node_graph;
let visualization;

function draw() {
    draw_background();

    visualization.show_node_graph();

    visualization.adjust_graph_positions();
}

function innitialize_node_graph(node_count) {
    let nodeGraph = [];

    // populate node graph with unconnected nodes
    for (let n = 0; n < node_count; n++) {
        nodeGraph.push(new node(n, []));
    }

    // randomly assign connections to nodes
    for (let n = 0; n < node_count; n++) {
        let connection_count = floor(random(1, node_count / 3));

        for (let c = 0; c < connection_count; c++) {
            let conneting_node = random(nodeGraph); // choose random node
            if (!nodeGraph[n].connections_contains_id(conneting_node.id)) {
                // only add to connections if it doesn't already contain it
                nodeGraph[n].connections.push(conneting_node);
            }
        }
    }

    return nodeGraph;
}
