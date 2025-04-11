class bound {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    containsdot(dot) {
        let x = dot[0];
        let y = dot[1];

        if (x >= this.x) {
            if (x <= this.x + this.w) {
                if (y >= this.y) {
                    if (y <= this.y + this.h) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    containsbound(range) {
        if (range.x <= this.x + this.w && range.x + range.w >= this.x) {
            // check if bounds are aligned on the x axis
            if (range.y <= this.y + this.h && range.y + range.h >= this.y) {
                // check if bounds are aligned on the y axis
                return true;
            }
        }

        return false;
    }
}