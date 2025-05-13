class node {
    constructor(id, connections) {
        this.id = id;
        this.connections = connections; // array of connected nodes
        this.highlighted = false;
    }

    connections_contains_id(other_id) {
        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].id == other_id) {
                return true;
            }
        }

        return false;
    }
}