class hamiltonian_solver {
    constructor(node_graph, start_node_id) {
        this.node_graph = node_graph;
        this.start_node_id = start_node_id;
        this.working_queue = [];
        this.solutions_set = new Set();
        this.solutions = [];
    }

    node_graph_deep_copy(original_graph) {
        const new_graph = new Map();

        // Step 1: Create a shallow clone of each node (connections left empty for now)
        for (const [key, node] of original_graph.entries()) {
            new_graph.set(n, { id: n, connections: [], highlighted: false });
        }

        // Step 2: Populate connections with references to the new graph's nodes
        for (const [key, old_node] of original_graph.entries()) {
            const new_node = new_graph.get(key);

            for (const neighbor of old_node.connections) {
                const neighbor_copy = new_graph.get(neighbor.id);
                new_node.connections.push(neighbor_copy);
            }
        }

        return new_graph;
    }

    push_solution(potential_path) {
        // check if the solution is already in the set
        const key = potential_path.join(",");
        if (!this.solutions_set.has(key)) {
            this.solutions_set.add(key);
            this.solutions.push([...path]); // store a clone of the path
        }
    }

    check_solution(potential_path) {
        return potential_path.length === this.node_graph.size;
    }
}