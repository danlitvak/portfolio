class node {
    constructor(id, connections) {
        this.id = id;
        this.connections = connections; // array of connected nodes
    }

    connections_contains_id(other_id) {
        this.connections.forEach(node => {
            if (node.id == other_id) {
                return true;
            }
        });

        return false;
    }
}