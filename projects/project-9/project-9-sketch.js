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
}

let vis_margin = 10;
let node_count = 10;
let node_graph;
let visualization;
let user_interface;

let nearest_node_id;

function draw() {
    draw_background();

    // user interface for dragging and zooming
    user_interface.handle_mouse_dragged();
    user_interface.handle_mouse_scroll();
    user_interface.return_transform();

    // show the current state of the node graph
    visualization.show_node_graph();

    // adjust the positions for visual pleasentness
    if (visualization.adjust_graph_positions() < 1e-5) {
        // console.log("done adjusting!");
    }

    nearest_node_id = visualization.highlight_nearest_node(user_interface.return_mouse_bound(visualization.bound));
    // console.log(nearest_node_id);
}

function innitialize_node_graph(node_count) {
    let nodeGraph = [];

    // populate node graph with unconnected nodes
    for (let n = 0; n < node_count; n++) {
        nodeGraph.push(new node(n, []));
    }

    // randomly assign connections to nodes
    for (let n = 0; n < node_count; n++) {
        let connection_count = abs(floor(randomGaussian(0, 3) + 1));

        let tries = 0;
        while (nodeGraph[n].connections.length < connection_count && tries < 100) {
            let conneting_node = random(nodeGraph); // choose random node
            if (!nodeGraph[n].connections_contains_id(conneting_node.id) && (nodeGraph[n].id != conneting_node.id)) {
                // only add to connections if it doesn't already contain it and is not itself
                nodeGraph[n].connections.push(conneting_node);
            }
            tries++;
        }
    }

    return nodeGraph;
}

// user inputs

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
            let nearest_node_index = 0; // set to anything really

            for (let n = 0; n < node_graph.length; n++) {
                if (node_graph[n].id == nearest_node_id) {
                    nearest_node_index = n; // index of the nearest node to delete
                }
            }

            node_graph.forEach(node => {
                node.delete_connection_from_id(nearest_node_id); // delete connection from each other node
            });

            node_graph.splice(nearest_node_index, 1);
        } else {
            console.log("Get closer to a node to delete it");
        }
    }
}