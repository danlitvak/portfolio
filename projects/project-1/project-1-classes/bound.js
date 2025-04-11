class bound {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    containspos(object) {
        const { x, y } = object.pos;
        return (
            x >= this.x && x <= this.x + this.w &&
            y >= this.y && y <= this.y + this.h
        );
    }


    containsbound(range) {
        return (
            range.x + range.w >= this.x &&
            range.x <= this.x + this.w &&
            range.y + range.h >= this.y &&
            range.y <= this.y + this.h
        );
    }
}