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

    node_graph = innitialize_node_graph(node_count);
    visualization = new node_graph_visualization(node_graph, { x: vis_margin, y: vis_margin, w: width - (vis_margin * 2), h: height - (vis_margin * 2) });
    user_interface = new user_pan_zoom(0, 0, 1, 1);
    solver = new hamiltonian_solver(node_graph);
}

// object declarations
let visualization;
let user_interface;
let solver;

let vis_margin = 10;
let node_count = 10;
let node_graph = new Map();
let nearest_node_id;

function draw() {
    draw_background();

    // user interface for dragging and zooming
    user_interface.handle_mouse_dragged();
    user_interface.handle_mouse_scroll();
    user_interface.return_transform();

    // show the current state of the node graph
    visualization.draw_node_graph(user_interface.pos, user_interface.zoom);

    // update graph positions
    visualization.adjust_graph_positions();

    // keep track of the nearest node to the mouse
    nearest_node_id = visualization.highlight_nearest_node(user_interface.return_mouse_bound(visualization.bound), user_interface.zoom);
}

// --- NODE GRAPH FUNCTIONS ---
function innitialize_node_graph(node_count) {
    let nodeGraph = new Map();

    // populate node graph with unconnected nodes
    for (let n = 0; n < node_count; n++) {
        nodeGraph.set(n, { id: n, connections: [], highlighted: false });
    }

    // randomly assign connections to nodes
    for (let n = 0; n < node_count; n++) {
        let this_node = nodeGraph.get(n);
        let connection_count = abs(floor(randomGaussian(0, 4) + 1));

        let tries = 0;
        while (this_node.connections.length < connection_count && tries < 100) {
            let connecting_node = get_random_node(nodeGraph);
            let connecting_node_id = connecting_node.id;

            if (!connections_contains_id(this_node.connections, connecting_node_id) && (this_node.id !== connecting_node_id)) {
                // only add to connections if it doesn't already contain it and is not itself
                this_node.connections.push(nodeGraph.get(connecting_node_id).id);
                // also add the reverse connection
                nodeGraph.get(connecting_node_id).connections.push(this_node.id);
            }

            tries++;
        }
    }

    // cull any nodes that are not connected to anything
    for (let n = 0; n < node_count; n++) {
        let this_node = nodeGraph.get(n);
        if (this_node.connections.length === 0) {
            delete_node_by_id(nodeGraph, this_node.id);
        }
    }

    return nodeGraph;
}

function get_random_node(node_graph) {
    const values = Array.from(node_graph.values());
    const randomIndex = Math.floor(Math.random() * values.length);
    return values[randomIndex];
}

function connections_contains_id(connections, id) {
    return connections.some(connection => connection === id);
}

function delete_node_by_id(d_node_graph, node_id) {
    // Remove all connections to the node
    d_node_graph.forEach((node, id) => {
        node.connections = node.connections.filter(connection => connection !== node_id);
    });

    // Remove the node itself
    d_node_graph.delete(node_id);
}

// --- USER INPUTS ---
function mouseDragged() {
    user_interface.is_user_dragging = true;
}

function mouseWheel(event) {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return true;
    user_interface.scroll_delta = event.deltaY;
    return false;
}

function keyPressed() {
    // create a new nodegraph
    if (key === ' ') {
        node_graph = innitialize_node_graph(node_count);
        visualization = new node_graph_visualization(node_graph, {
            x: vis_margin,
            y: vis_margin,
            w: width - vis_margin * 2,
            h: height - vis_margin * 2
        });
    }

    if (key === "d" || key === "D") {
        // delete the nearest node
        if (nearest_node_id !== null) {
            delete_node_by_id(node_graph, nearest_node_id);
            console.log("Node: " + nearest_node_id + " deleted.");
        } else {
            console.log("Get closer to a node to delete.");
        }
    }
}

function mousePressed() {
    // will be used to begin solving the hamiltonian path
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return true;

    if (nearest_node_id !== null) {
        console.log("Hamiltonian path solving started at node: " + nearest_node_id);
    } else {
        console.log("Get closer to a node to start solving.");
    }
}