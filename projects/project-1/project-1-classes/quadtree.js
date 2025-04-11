class quadtree {
    constructor(maxobjects, bound) {
        this.objects = [];
        this.maxobjects = maxobjects;
        this.bound = bound;
        this.divided = false;
        this.searched = false;
    }

    returnrefactor() {
        if (this.divided) {
            return [
                ...this.tl.returnrefactor(),
                ...this.tr.returnrefactor(),
                ...this.bl.returnrefactor(),
                ...this.br.returnrefactor()
            ];
        }

        // Find boids that need to be reinserted
        const toReinsert = this.objects.filter(obj => !this.bound.containspos(obj));

        // Remove them from the current node
        this.objects = this.objects.filter(obj => this.bound.containspos(obj));

        return toReinsert;
    }

    cull() {
        if (!this.divided) return; // If it's not divided, nothing to cull

        // Check total objects in all child nodes
        const totalObjects = this.countobjects();

        // If total objects are within capacity, merge and delete children
        if (totalObjects <= this.maxobjects) {
            this.objects = this.returnobjects(); // Collect all objects from children
            this.tl = this.tr = this.bl = this.br = null; // Remove children
            this.divided = false; // Mark as no longer divided
        } else {
            // Recursively cull child nodes
            this.tl.cull();
            this.tr.cull();
            this.bl.cull();
            this.br.cull();
        }
    }



    query(range, found) {
        if (!found) {
            found = [];
        }

        this.searched = false;

        if (this.bound.containsbound(range)) {
            // the bound contains the query range
            if (this.divided) {
                // this tree is divided so query the children
                // therefor if it is divded then it cannot be "searched"
                this.tl.query(range, found);
                this.tr.query(range, found);
                this.bl.query(range, found);
                this.br.query(range, found);
            } else {
                this.searched = true;

                this.objects.forEach((object) => {
                    if (range.containspos(object)) {
                        found.push(object);
                    }
                });

                return found;
            }
        }

        // bound does not contain query, end search
        return found;
    }

    insert(object) {
        if (this.bound.containspos(object)) {
            if (this.divided) {
                let x = object.pos.x; // pos x
                let y = object.pos.y; // pos y

                let mx = this.bound.x + this.bound.w / 2; // mid x
                let my = this.bound.y + this.bound.h / 2; // mid y

                switch ((x >= mx) + 2 * (y >= my)) {
                    case 0:
                        this.tl.insert(object);
                        break; // (x ≤ mx, y ≤ my)
                    case 1:
                        this.tr.insert(object);
                        break; // (x ≥ mx, y ≤ my)
                    case 2:
                        this.bl.insert(object);
                        break; // (x ≤ mx, y ≥ my)
                    case 3:
                        this.br.insert(object);
                        break; // (x ≥ mx, y ≥ my)
                }
            } else {
                this.objects.push(object);
                if (this.objects.length >= this.maxobjects) this.divide();
            }
        }
    }

    finddepth() {
        if (!this.divided) return 1;

        return (max(this.tl.finddepth(), this.tr.finddepth(), this.bl.finddepth(), this.br.finddepth()) + 1);
    }

    divide() {
        // If there's no meaningful space left, just return.
        if (this.bound.w <= 1 || this.bound.h <= 1) {
            console.log("Warning: Possible maximum call stack size reached, stopped quad tree division");
            return;
        }

        // create new quad trees
        this.tl = new quadtree(this.maxobjects, new bound(this.bound.x, this.bound.y, this.bound.w / 2, this.bound.h / 2));
        this.tr = new quadtree(this.maxobjects, new bound(this.bound.x + this.bound.w / 2, this.bound.y, this.bound.w / 2, this.bound.h / 2));
        this.bl = new quadtree(this.maxobjects, new bound(this.bound.x, this.bound.y + this.bound.h / 2, this.bound.w / 2, this.bound.h / 2));
        this.br = new quadtree(this.maxobjects, new bound(this.bound.x + this.bound.w / 2, this.bound.y + this.bound.h / 2, this.bound.w / 2, this.bound.h / 2));

        // insert data smartly into new trees
        let hw = this.bound.w / 2; // half width
        let hh = this.bound.h / 2; // half height
        let mx = this.bound.x + hw; // mid x
        let my = this.bound.y + hh; // mid y

        // distribute objects
        for (let n = 0; n < this.objects.length; n++) {
            let x = this.objects[n].pos.x;
            let y = this.objects[n].pos.y;

            switch ((x >= mx) + 2 * (y >= my)) {
                case 0:
                    this.tl.insert(this.objects[n]);
                    break; // (x <= mx, y <= my)
                case 1:
                    this.tr.insert(this.objects[n]);
                    break; // (x >= mx, y <= my)
                case 2:
                    this.bl.insert(this.objects[n]);
                    break; // (x <= mx, y >= my)
                case 3:
                    this.br.insert(this.objects[n]);
                    break; // (x >= mx, y >= my)
            }
        }

        // finnaly delete points from this quad
        this.objects = [];

        // set quad state to divided
        this.divided = true;
    }

    countobjects(count) {
        if (!count) count = 0;

        if (this.divided) {
            return (this.tl.countobjects(count) + this.tr.countobjects(count) + this.bl.countobjects(count) + this.br.countobjects(count));
        } else {
            return this.objects.length;
        }
    }

    returnobjects(robjects = []) {
        if (this.divided) {
            return [
                ...this.tl.returnobjects(),
                ...this.tr.returnobjects(),
                ...this.bl.returnobjects(),
                ...this.br.returnobjects()
            ];
        }
        return [...robjects, ...this.objects];
    }

    show() {
        push();
        if (this.divided) {
            this.tl.show();
            this.tr.show();
            this.bl.show();
            this.br.show();
        } else {
            strokeWeight(1);
            stroke(255, 150);
            noFill();

            // if (this.searched) {
            //   fill(40, 40);
            //   stroke(255);
            // }

            rect(this.bound.x, this.bound.y, this.bound.w, this.bound.h);

            noStroke();
            fill(255, 0, 0);
            this.objects.forEach((object) => {
                let x = object.pos.x;
                let y = object.pos.y;

                // circle(x, y, 2);
            });
        }
        pop();

        this.searched = false;
    }
}