class user_pan_zoom {
    constructor(init_x, init_y, init_zoom_x, init_zoom_y) {
        this.pos = { x: init_x, y: init_y };
        this.zoom = { x: init_zoom_x, y: init_zoom_y };

        this.zoom_sens = 0.001;
        this.min_zoom = { x: 0.01, y: 0.01 };
        this.max_zoom = { x: 1000, y: 1000 };

        this.is_user_dragging = false;
        this.scroll_delta = 0;
    }

    return_mouse_bound(bound) {
        // bound = {x: x, y: y, w: w, h: h};

        // transform mouse position from screen space into world space
        let mx = mouseX;
        let my = mouseY;

        mx /= this.zoom.x;
        my /= this.zoom.y;


        mx -= this.pos.x;
        my -= this.pos.y;

        mx = map(mx, bound.x, bound.x + bound.w, 0, 1);
        my = map(my, bound.y, bound.y + bound.h, 0, 1);

        return { x: mx, y: my };
    }

    return_transform() {
        scale(this.zoom.x, this.zoom.y);
        translate(this.pos.x, this.pos.y);
    }

    handle_mouse_dragged() {
        if (!this.is_user_dragging) return;

        let dx = mouseX - pmouseX;
        let dy = mouseY - pmouseY;

        dx /= this.zoom.x;
        dy /= this.zoom.y;

        this.pos.x += dx;
        this.pos.y += dy;

        this.is_user_dragging = false;
    }

    handle_mouse_scroll() {
        if (!this.scroll_delta) return;

        // tune scroll delta by sensativity
        this.scroll_delta *= this.zoom_sens;
        let scale_delta = 1 - this.scroll_delta;

        this.zoom.x *= scale_delta;
        this.zoom.y *= scale_delta;

        // clamp zoom
        this.zoom.x = constrain(this.zoom.x, this.min_zoom.x, this.max_zoom.x);
        this.zoom.y = constrain(this.zoom.y, this.min_zoom.y, this.max_zoom.y);

        // reset scroll delta
        this.scroll_delta = 0;
    }
}