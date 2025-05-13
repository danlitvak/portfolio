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

    delete_connection_from_id(delete_id) {
        let delete_id_index = null; // may not contain other id to delete

        for (let c = 0; c < this.connections.length; c++) {
            let other_node = this.connections[c];
            let other_id = other_node.id;

            if (other_id === delete_id) {
                delete_id_index = c;
            }
        }

        if (delete_id_index !== null) {
            // if its not equal to null, then splice from the connections
            this.connections.splice(delete_id_index, 1);
        }
    }
}