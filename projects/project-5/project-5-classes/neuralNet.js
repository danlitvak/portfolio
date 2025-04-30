class NeuralNetwork {
    constructor(layerSizes, bound) {
        this.layerSizes = layerSizes; // array of layer sizes
        this.bound = bound; // store the bound for drawing

        this.rand_reset_network(); // initialize the network with random weights and biases
    }

    // reset the network with random weights, biases and value of 0
    rand_reset_network() {
        this.network = new Array(this.layerSizes.length);
        for (let i = 0; i < this.layerSizes.length; i++) {
            this.network[i] = new Array(this.layerSizes[i]);
            for (let j = 0; j < this.layerSizes[i]; j++) {
                this.network[i][j] = [
                    i < this.layerSizes.length - 1
                        ? new Array(this.layerSizes[i + 1]).fill(0).map(() => random(-1, 1)) // Random weights for non-output layers
                        : [], // No weights for the output layer
                    random(-1, 1), // Random bias
                    0 // Reset output to 0
                ];
            }
        }
    }

    // return the output of the neural network after propagating the input
    output() {
        let output = this.network[this.network.length - 1][0][2]
        // return this.sigmoid(output); // Apply sigmoid to the output
        return Math.atan(output); // Apply atan to the output
    }

    // propagate the input through the network
    forward_propagate(input) {
        // Set the input layer's output to the input values
        for (let i = 0; i < this.network[0].length; i++) {
            this.network[0][i][2] = input[i];
        }

        // Propagate through the network
        for (let x = 0; x < this.network.length - 1; x++) {
            let layer = this.network[x];
            let nextLayer = this.network[x + 1];

            for (let y = 0; y < nextLayer.length; y++) {
                let sum = 0;
                for (let i = 0; i < layer.length; i++) {
                    sum += layer[i][2] * layer[i][0][y]; // weights
                }
                sum += nextLayer[y][1]; // bias
                nextLayer[y][2] = this.relu(sum); // output
            }
        }
    }

    // show the neural network
    show() {
        push();
        translate(this.bound.x, this.bound.y);
        noFill();
        stroke(255);
        strokeWeight(1);

        let xSpacing = this.bound.w / (this.network.length + 1);

        // Draw connections first
        for (let x = 0; x < this.network.length - 1; x++) {
            let layer = this.network[x];
            let nextLayer = this.network[x + 1];
            let ySpacing = this.bound.h / layer.length;
            let nextYSpacing = this.bound.h / nextLayer.length;

            for (let y = 0; y < layer.length; y++) {
                let node = layer[y];
                let w = node[0];

                let nodeX = (x + 1) * xSpacing;
                let nodeY = y * ySpacing + ySpacing / 2;

                for (let i = 0; i < w.length; i++) {
                    let nextNodeY = i * nextYSpacing + nextYSpacing / 2;
                    let weight = w[i];
                    if (weight < 0) {
                        stroke(0, 255, 0, abs(weight) * 255); // Set opacity proportional to weight
                    } else {
                        stroke(255, 0, 0, abs(weight) * 255); // Set opacity proportional to weight
                    }
                    line(nodeX, nodeY, (x + 2) * xSpacing, nextNodeY);
                }
            }
        }

        // Draw nodes
        for (let x = 0; x < this.network.length; x++) {
            let layer = this.network[x];
            let ySpacing = this.bound.h / layer.length;
            let rectHeight = ySpacing * 1; // Ensure rectangles fit within the bound height

            for (let y = 0; y < layer.length; y++) {
                let node = layer[y];
                let o = node[2];
                let bias = node[1];

                let nodeX = (x + 1) * xSpacing;
                let nodeY = y * ySpacing + ySpacing / 2;

                // Map bias to stroke color range
                let biasColorValue = map(bias, -1, 1, 0, 255);
                fill(0, 128);
                stroke(biasColorValue); // Set stroke color based on bias
                strokeWeight(1); // Set stroke weight to 1
                rectMode(CENTER); // Set rectangle mode to center
                rect(nodeX, nodeY, 20, rectHeight); // Draw rectangle for neuron

                let colorValue = o * 255; // Map output value to color range
                noStroke();
                fill(255);

                // Adjust text size to fit within the rectangle
                let textSizeValue = Math.min(8, rectHeight * 0.7); // Scale text size based on rectangle height
                textSize(textSizeValue);
                textAlign(CENTER, CENTER); // Center-align text
                text(o.toFixed(2), nodeX, nodeY);
            }
        }
        pop();
    }

    // Set the neural network from a JSON object
    set_network_from_json(json) {
        for (let i = 0; i < json.length; i++) {
            let layerJson = json[i];
            let layer = this.network[i];
            for (let j = 0; j < layerJson.length; j++) {
                let nodeJson = layerJson[j];
                let node = layer[j];
                node[0] = nodeJson.weights.slice(); // Copy weights
                node[1] = nodeJson.bias; // Set bias
                node[2] = nodeJson.output; // Set output
            }
        }
    }

    // Convert the neural network to a JSON object
    jsonify_network() {
        let json = [];
        for (let i = 0; i < this.network.length; i++) {
            let layer = this.network[i];
            let layerJson = [];
            for (let j = 0; j < layer.length; j++) {
                let node = layer[j];
                layerJson.push({
                    weights: node[0],
                    bias: node[1],
                    output: node[2]
                });
            }
            json.push(layerJson);
        }
        console.log(JSON.stringify(json));
    }

    // Print the neural network to the console
    print_network() {
        for (let i = 0; i < this.network.length; i++) {
            let layer = this.network[i];
            console.log(`Layer ${i}:`);
            for (let j = 0; j < layer.length; j++) {
                let node = layer[j];
                console.log(`  Node ${j}:`);
                console.log(`    Weights: ${node[0]}`);
                console.log(`    Bias: ${node[1]}`);
                console.log(`    Output: ${node[2]}`);
            }
        }
        console.log("---------------");
    }

    // Clone the neural network from another two neural networks
    set_from_crossover(net1, net2) {
        let network1 = net1.network;
        let network2 = net2.network;
        for (let i = 0; i < this.network.length; i++) {
            for (let j = 0; j < this.network[i].length; j++) {
                let node = this.network[i][j];
                let newNode1 = network1[i][j];
                let newNode2 = network2[i][j];

                // Crossover weights
                for (let k = 0; k < node[0].length; k++) {
                    node[0][k] = Math.random() < 0.5 ? newNode1[0][k] : newNode2[0][k];
                }
                // Crossover bias
                node[1] = Math.random() < 0.5 ? newNode1[1] : newNode2[1];
            }
        }
    }

    // Clone the neural network from another neural network
    copy_network(network) {
        for (let i = 0; i < this.network.length; i++) {
            for (let j = 0; j < this.network[i].length; j++) {
                let node = this.network[i][j];
                let newNode = network[i][j];

                node[0] = newNode[0].slice(); // Copy weights
                node[1] = newNode[1];        // Copy bias
                node[2] = newNode[2];        // Copy output
            }
        }
    }

    // Mutate the neural network by a given mutation rate
    mutate(mutationRate) {
        for (let i = 0; i < this.network.length; i++) {
            for (let j = 0; j < this.network[i].length; j++) {
                let node = this.network[i][j];
                // Mutate weights
                for (let k = 0; k < node[0].length; k++) {
                    if (Math.random() < mutationRate) {
                        node[0][k] += random(-1, 1);
                    }
                }
                // Mutate bias
                if (Math.random() < mutationRate) {
                    node[1] += random(-1, 1);
                }
            }
        }
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    relu(x) {
        return Math.max(0, x);
    }
}