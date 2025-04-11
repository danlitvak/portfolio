class quadtree {
    constructor(maxdots, bound) {
        this.dots = [];
        this.maxdots = maxdots;
        this.bound = bound;
        this.divided = false;
        this.searched = false;
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

                this.dots.forEach((dot) => {
                    if (range.containsdot(dot)) {
                        found.push([dot[0], dot[1]]);
                    }
                });

                return found;
            }
        }

        // bound does not contain query, end search
        return found;
    }

    insert(dot) {
        if (this.bound.containsdot(dot)) {
            if (this.divided) {
                // if divided pass dot along to correct quad

                let mx = this.bound.x + (this.bound.w / 2) // mid x
                let my = this.bound.y + (this.bound.h / 2) // mid y

                if (dot[0] <= mx && dot[1] <= my) {
                    this.tl.insert([dot[0], dot[1]]);

                } else if (dot[0] >= mx && dot[1] <= my) {
                    this.tr.insert([dot[0], dot[1]]);

                } else if (dot[0] <= mx && dot[1] >= my) {
                    this.bl.insert([dot[0], dot[1]]);

                } else if (dot[0] >= mx && dot[1] >= my) {
                    this.br.insert([dot[0], dot[1]]);
                }

            } else {
                // if not already divided, push dot and check

                this.dots.push(dot);

                if (this.dots.length >= this.maxdots) {
                    this.divide();
                }
            }
        }
    }

    finddepth() {
        if (!this.divided) return 1;
        return max(this.tl.finddepth(), this.tr.finddepth(), this.bl.finddepth(), this.br.finddepth()) + 1
    }

    divide() {
        // create new quad trees
        this.tl = new quadtree(this.maxdots, new bound(this.bound.x, this.bound.y, this.bound.w / 2, this.bound.h / 2));
        this.tr = new quadtree(this.maxdots, new bound(this.bound.x + this.bound.w / 2, this.bound.y, this.bound.w / 2, this.bound.h / 2));
        this.bl = new quadtree(this.maxdots, new bound(this.bound.x, this.bound.y + this.bound.h / 2, this.bound.w / 2, this.bound.h / 2));
        this.br = new quadtree(this.maxdots, new bound(this.bound.x + this.bound.w / 2, this.bound.y + this.bound.h / 2, this.bound.w / 2, this.bound.h / 2));

        // insert data smartly into new trees
        let mx = this.bound.x + (this.bound.w / 2) // mid x
        let my = this.bound.y + (this.bound.h / 2) // mid y

        // distribute dots
        for (let n = 0; n < this.dots.length; n++) {
            if (this.dots[n][0] <= mx && this.dots[n][1] <= my) {
                this.tl.insert([this.dots[n][0], this.dots[n][1]]);

            } else if (this.dots[n][0] >= mx && this.dots[n][1] <= my) {
                this.tr.insert([this.dots[n][0], this.dots[n][1]]);

            } else if (this.dots[n][0] <= mx && this.dots[n][1] >= my) {
                this.bl.insert([this.dots[n][0], this.dots[n][1]]);

            } else if (this.dots[n][0] >= mx && this.dots[n][1] >= my) {
                this.br.insert([this.dots[n][0], this.dots[n][1]]);
            }
        }

        // finnaly delete points from this quad
        this.dots = [];

        // set quad state to divided
        this.divided = true;
    }

    refactor(newmaxdots) {
        // collect all dots into one array
        // set this.divided = false;
        // reinsert dots



    }

    countdots(count) {
        if (!count) {
            count = 0;
        }

        if (this.divided) {
            return this.tl.countdots(count) + this.tr.countdots(count) + this.bl.countdots(count) + this.br.countdots(count)
        } else {
            return this.dots.length;
        }
    }

    returndots(rdots) {
        if (this.divided) {
            this.tl.returndots(rdots).forEach((dot) => { rdots.push(dot); });
            this.tr.returndots(rdots).forEach((dot) => { rdots.push(dot); });
            this.bl.returndots(rdots).forEach((dot) => { rdots.push(dot); });
            this.br.returndots(rdots).forEach((dot) => { rdots.push(dot); });

            return rdots;
        } else {

            this.dots.forEach((dot) => { rdots.push(dot); });
            return rdots;
        }
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
            stroke(255, 50);
            noFill();

            if (this.searched) {
                fill(40);
                stroke(255);
            }

            rect(this.bound.x, this.bound.y, this.bound.w, this.bound.h);

            noStroke();
            fill(255, 0, 0);
            this.dots.forEach((dot) => {
                circle(dot[0], dot[1], 2);
            });
        }
        pop();

        this.searched = false;
    }
}