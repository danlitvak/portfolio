class NeuralNetwork {
    constructor(layerSizes) {
        this.network = new Array(layerSizes.length);
        
        for (let i = 0; i < layerSizes.length; i++) {
            this.network[i] = new Array(layerSizes[i]);
            for (let j = 0; j < layerSizes[i]; j++) {
                this.network[i][j] = [
                    new Array(layerSizes[i + 1]).fill(0).map(() => this.rand(-1, 1)), // weights
                    this.rand(-1, 1), // bias
                    0 // output
                ]
            }
        }
    }

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

   

    show(bound) {
        push();
        translate(bound.x, bound.y);
        noFill();
        stroke(255);
        strokeWeight(2);
        rect(0, 0, bound.w, bound.h);

        // make each layer centered within the bound
        let xSpacing = bound.w / (this.network.length + 1);

        // Draw connections first
        for (let x = 0; x < this.network.length - 1; x++) {
            let layer = this.network[x];
            let nextLayer = this.network[x + 1];
            let ySpacing = bound.h / (layer.length + 1);
            let nextYSpacing = bound.h / (nextLayer.length + 1);

            for (let y = 0; y < layer.length; y++) {
            let node = layer[y];
            let w = node[0];

            let nodeX = (x + 1) * xSpacing;
            let nodeY = (y + 1) * ySpacing;

            for (let i = 0; i < w.length; i++) {
                let nextNodeY = (i + 1) * nextYSpacing;
                let weight = w[i];
                stroke(0, 255, 0, weight * 255); // Set opacity proportional to weight
                line(nodeX, nodeY, (x + 2) * xSpacing, nextNodeY);
            }
            }
        }

        // Draw nodes
        for (let x = 0; x < this.network.length; x++) {
            let layer = this.network[x];
            let ySpacing = bound.h / (layer.length + 1);

            for (let y = 0; y < layer.length; y++) {
                let node = layer[y];
                let o = node[2];
                let bias = node[1];

                let nodeX = (x + 1) * xSpacing;
                let nodeY = (y + 1) * ySpacing;
                
                // Map bias to stroke color range
                let biasColorValue = map(bias, -1, 1, 0, 255);
                fill(0);
                stroke(biasColorValue); // Set stroke color based on bias
                strokeWeight(2); // Set stroke weight to 2
                circle(nodeX, nodeY, 20);

                let colorValue = o * 255; // Map output value to color range
                noStroke();
                fill(255);
                text(o.toFixed(2), nodeX, nodeY);
            }
        }

        pop();
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    relu(x) {
        return Math.max(0, x);
    }

    rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    dot_arr(arr1, arr2){
        let result = 0;
        for (let i = 0; i < arr1.length; i++) {
            result += arr1[i] * arr2[i];
        }
        return result;
    }
}