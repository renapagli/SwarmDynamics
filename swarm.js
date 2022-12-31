// Define vector object and methods
//
//
  var Vector2D = function Vector2D(x, y) {
    this.set(x, y);
  }, v2dp = Vector2D.prototype;

  v2dp.dot2d = function(x, y) {
    return ((this.x * x) + (this.y * y));
  };


  v2dp.set = function(x, y) {
    this.x = x;
    this.y = y;

    return this;
  };

  v2dp.add = function(other) {
    if(typeof other === "number") {
      this.x += other, this.y += other;
      return this;
    }
    this.x += other.x, this.y += other.y;
    return this;
  };

  v2dp.sub = function(other) {
    if(typeof other === "number") {
      this.x -= other, this.y -= other;
      return this;
    }
    this.x -= other.x, this.y -= other.y;
    return this;
  };

  v2dp.mul = function(other) {
    if(typeof other === "number") {
      this.x *= other, this.y *= other;
      return this;
    }
    this.x *= other.x, this.y *= other.y;
    return this;
  };

  v2dp.div = function(other) {
    if(typeof other === "number") {
      if (other != 0) {
        this.x /= other, this.y /= other;
      }
      return this;
    }
    this.x /= other.x, this.y /= other.y;
    return this;
  };

  v2dp.move = function(dest) {
    if(dest instanceof Vector2D) {
      dest.x = this.x, dest.y = this.y;
    }
    return this;
  };

  v2dp.within2d = function(bounds) {
    return (this.x >= 0 && this.x < bounds.x && this.y >= 0 && this.y < bounds.y);
  };

  v2dp.wrap2d = function(bounds) {
    if(this.x > bounds.x) {
      this.x = 0;
      return true;
    }

    if(this.x < 0) {
      this.x = bounds.x;
      return true;
    }

    if(this.y > bounds.y) {
      this.y = 0;
      return true;
    }

    if(this.y < 0) {
      this.y = bounds.y;
      return true;
    }
  };

  v2dp.eq = function(other) {
    return (other instanceof Vector2D) && this.x === other.x && this.y === other.y;
  };

  v2dp.dist = function(other) {
    var dx = (this.x - other.x),
        dy = (this.y - other.y);

    return Math.sqrt(dx * dx + dy * dy);
  };

  v2dp.mag = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  v2dp.angle = function() {
    return Math.atan2(this.y, this.x);
  };

  v2dp.clone = function() {
    return new Vector2D(this.x, this.y);
  };


// Define particle object and methods
//
//
  var Particle = function Particle(x, y, bounds, particleTrailWidth, strokeColor, id) {
    this.p = new Vector2D(x,y); // position
    context.arc(500, 500, 20, 0, Math.PI * 2, true); // circle
    this.t = new Vector2D(x,y); // trail to
    this.color = strokeColor;
    this.particleTrailWidth = particleTrailWidth;
    this.b = bounds;    // window bounds for wrapping
    this.m = new MouseMonitor(canvas);       // mouse position monitor
    this.r = function getRandom(min,max) {
        return Math.random() * (max - min) + min;
    }
    this.v = new Vector2D(0,0); //new Vector2D(this.r(-1,1), this.r(-1,1)); // velocity
    this.id = id;
    this.active = true;
  }, pp = Particle.prototype;

  pp.reset = function() {
    // new random position
    this.p.x = this.t.x = Math.floor(this.r(0, this.b.x));
    this.p.y = this.t.y = Math.floor(this.r(0, this.b.y));

    // reset velocity
    this.v = new Vector2D(this.r(-1,1), this.r(-1,1));

    // iteration and life
    this.i = 0;
    this.l = this.r(1000, 10000); // life time before particle respawns

  };

  pp.repulsion = function() {
    let d_r = new Vector2D(0,0);
    let p_r = particles.filter((element) => (this.p.dist(element.p) < r_r) && (element.id != this.id) && (element.active));
    if (this.id == 0) { r_neighbours = p_r; }

    if (p_r.length > 0) {
        for (const particle of p_r) {
          d_r.add(this.p.clone().sub(particle.p).div(this.p.dist(particle.p)));
        }
        return d_r;
    }
    else {return false;}
  }

  pp.attraction = function() {
    let d_a = new Vector2D(0,0);
    let p_a = particles.filter((element) => (this.p.dist(element.p) < r_a) && (this.p.dist(element.p) > r_o) && (element.id != this.id)  && (element.active) );
    if (this.id == 0) { a_neighbours = p_a; }

    if (p_a.length > 0) {
        for (const particle of p_a) {
          d_a.add(particle.p.clone().sub(this.p).div(particle.p.dist(this.p)));
        }
        return d_a;
    }
    else {return false;}
  }

  pp.orientation = function() {
    let d_o = new Vector2D(0,0);
    let p_o = particles.filter((element) => (this.p.dist(element.p) < r_o) && (this.p.dist(element.p) > r_r) && (element.id != this.id) && (element.active) );
    if (this.id == 0) { o_neighbours = p_o; }

    if (p_o.length > 0) {
        for (const particle of p_o) {
          d_o.add(particle.v.clone().sub(this.v).div(particle.v.dist(this.v)));
        }
        return d_o;
    }
    else {return false;}
  }

  pp.step = function() {
    if(this.i++ > this.l) {
      this.reset();
    }

    let new_direction = this.v.angle();
    let curr_direction = this.v.angle();
    // call all functions for particle 0 to ensure neighbours are updated
    if (this.id == 0 ) {
        this.repulsion();
        this.attraction();
        this.orientation();
    }

    // if there is any other particle in the zone of rejection, then move away
    let d_r = this.repulsion();
    if (d_r) {new_direction = d_r.angle()}
    // else check for particles in the orientation and attraction zones
    else {
        let d_a = this.attraction();
        let d_o = this.orientation();
        if (d_a && d_o) {
            new_direction = d_a.add(d_o).div(2).angle();
        }
        else if (d_a && !d_o) {
            new_direction = d_a.angle();
        }
        else if (!d_a && d_o) {
            new_direction = d_o.angle();
        }
        // else continue moving in the same direction as before
        else {new_direction = curr_direction}
    }

    // calculate the new velocity based on alignment to the orientation of the group
    // add noise as random velocity in a random direction
    let diff = new_direction - curr_direction;
    let turningDirection = Math.abs(diff) < Math.PI ? Math.sign(diff) : -Math.sign(diff);
    let turningMagnitude = Math.abs(diff) < turningSpeed.value ? new_direction : curr_direction + turningDirection*turningSpeed.value;
    let n = 0.3; // noise level in radians
    // update speed direction
    this.v.x = Math.cos(turningMagnitude + this.r(-n, n));
    this.v.y = Math.sin(turningMagnitude + this.r(-n, n));
    // Process mouse events
    //
    if(this.m.state.left) {
      // add a difference between mouse pos and particle pos (a fraction of it) to the velocity.
      this.v.add(this.m.position.clone().sub(this.p).mul(.00085));
    }

    // repulse the particles if the right mouse button is down and the distance between
    // the mouse and particle is below an arbitrary value between 200 and 250.
    if(this.m.state.right && this.p.dist(this.m.position) < this.r(200, 250)) {
      this.v.add(this.p.clone().sub(this.m.position).mul(.002));
    }

    // time dilation field, stuff moves at 10% here, depending on distance
    if(this.m.state.middle) {
      var d = this.p.dist(this.m.position),
          l = this.r(200, 250);

      if(d < l) {
        this.v.mul(d / l);
      }
    }
    //
    // End process mouse events

    // step and keep a copy of the current position, for a nice line between then and now
    this.p.move(this.t).add(this.v);

    // wrap around the edges
    if(this.p.wrap2d(this.b)) {
      this.p.move(this.t);
    }
  };

  // plot the line, but do not stroke yet.
  pp.render = function() {
//    context.strokeStyle = this.color;
    context.lineWidth = this.particleTrailWidth;
    context.moveTo(this.p.x, this.p.y);
    context.lineTo(this.t.x, this.t.y);
  };


// Define mouse events functions
//
//
  var MouseMonitor = function(element) {
    this.position = new Vector2D(0, 0);
    this.state    = {left: false, middle: false, right: false};
    this.element  = element;

    var that = this;
    element.addEventListener('mousemove', function(event) {
      var dot, eventDoc, doc, body, pageX, pageY;
      event = event || window.event;
      if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;
        event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0 );
      }

      that.position.x = event.pageX;
      that.position.y = event.pageY;
    });

    element.addEventListener('contextmenu', function(event) {
      return event.preventDefault();
    });

    element.addEventListener('mousedown', function(event) {
      if(event.which === 1) that.state.left = true;
      if(event.which === 2) that.state.middle = true;
      if(event.which === 3) that.state.right = true;

      return event.preventDefault();
    });

    element.addEventListener('mouseup', function(event) {
      that.state.left = that.state.middle = that.state.right = false;

      return event.preventDefault();
    });
  };


// Define functions
//
//
function generateColor() {
  let hexSet = "0123456789ABCDEF";
  let finalHexString = "#";
  for (let i = 0; i < 6; i++) {
    finalHexString += hexSet[Math.ceil(Math.random() * 15)];
  }
  return finalHexString;
}

function generateParticles(amount) {
  // place particles along Fermat's Spiral
  for (let i = 0; i < amount; i++) {
    particles.push(new Particle(
          innerWidth/2 + i * 1 * Math.cos(i),
          innerHeight/2 + i * 1 * Math.sin(i),
          bounds,
          3,
          generateColor(),
          i
        )
    );
  }
}


function renderDiagram(particle) {

    // skip rendering of diagram if we are in live mode
    if (diagramLive.checked && particle === undefined) {return false};
    if (!diagramLive.checked) { console.log('re-draw diagram')}
    //else
    let x, y, r, alpha, ctx_;
    if (particle === undefined) {
        cvs.height = 200;
        ctx_ = ctx;
        x = cvs.width/2;
        y = cvs.height/2;
        r = ((cvs.width/2) -2) / (parseInt(attractionZone.getAttribute('max')) + parseInt(orientationZone.getAttribute('max')) + parseInt(repulsionZone.getAttribute('max')));
        alpha = 1;
        stroke_c = 'rgba(255,255,255,1)';
    }
    else {
        ctx_ = context;
        x = particle.p.x;
        y = particle.p.y;
        r = 1;
        alpha = 0.02;
        stroke_c = 'rgba(0,0,0,1)';
        ctx_.globalCompositeOperation = 'screen';

    }

    color_a = 'rgba(0,0,255,' + alpha + ')';
    color_o = 'rgba(0,255,0,' + alpha + ')';
    color_r = 'rgba(255,0,0,' + alpha + ')';
    ctx_.beginPath();
    ctx_.strokeStyle = stroke_c;
    ctx_.fillStyle = color_a;
    ctx_.arc(x, y, r_a*r, 0, Math.PI * 2, true);
    ctx_.stroke();
    ctx_.fill()

    ctx_.beginPath();
    ctx_.strokeStyle = stroke_c;
    ctx_.fillStyle = color_o;
    ctx_.arc(x, y, r_o*r, 0, Math.PI * 2, true);
    ctx_.stroke();
    ctx_.fill()

    ctx_.beginPath();
    ctx_.strokeStyle = stroke_c;
    ctx_.fillStyle = color_r;
    ctx_.arc(x, y, r_r*r, 0, Math.PI * 2, true);
    ctx_.stroke();
    ctx_.fill()
}

// Control div event listeners
//
//
function updateZones() {
    r_r = parseInt(repulsionZone.value);
    r_o = parseInt(repulsionZone.value) + parseInt(orientationZone.value);
    r_a = parseInt(repulsionZone.value) + parseInt(orientationZone.value) + parseInt(attractionZone.value);
}
attractionZone.addEventListener('change', (e) => {
    updateZones();
    renderDiagram();
});
orientationZone.addEventListener('change', (e) => {
    updateZones();
    renderDiagram();
});
repulsionZone.addEventListener('change', (e) => {
    updateZones();
    renderDiagram();
});
turningSpeed.addEventListener('change', (e) => {
    rotateSpeed = parseInt(turningSpeed.value);
});
numAgents.addEventListener('change', (e) => {
    for (const p of particles) {
      if (p.id < parseInt(numAgents.value)) {p.active = true}
      else {p.active = false}
    }
});
diagramLive.addEventListener('click', (e) => {
    let temp = diagramLive.checked ? cvs.height = 0 : renderDiagram();
});

function render() {
    if (renderFlag) {
        requestAnimationFrame(render);
        renderFlag = false;
    }

    // Find group velocity
//    for(var i = 0; i < particles.length; i += 1) {
//      particles_theta += particles[i].v.angle();
//    }
//    particles_theta /= particles.length;

    // draw background
    context.globalCompositeOperation = 'source-over';
    if(settings.fadeOverlay) {
      context.fillStyle = 'rgba(0, 0, 0, .3)';
    } else {
      context.fillStyle = 'rgba(0, 0, 0, 1)';
    }
    context.fillRect(0, 0, width, height);

    // draw zones circles around particle 0
    if (diagramLive.checked) {renderDiagram(particles[0]);}

    context.globalCompositeOperation = 'lighter';
    // render each particle and trail
    context.beginPath();
    for(var i = 0; i < numAgents.value; i += 1) {
      particles[i].step(), particles[i].render();
    }
    if(settings.rotateColor) {
      context.strokeStyle = 'hsla(' + hue + ', 75%, 50%, .55)';
    } else {
      context.strokeStyle = settings.staticColorString;
    }
    context.stroke();
    context.closePath();

    hue = ((hue + .5) % 360);

    if (diagramLive.checked) {
        // draw neighbours
        context.beginPath();
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = 'rgba(255,0,0,1)'; // repulsion
        for(var i = 0; i < r_neighbours.length; i += 1) {
            r_neighbours[i].render();
        }
        context.stroke();
        context.closePath();

        context.beginPath();
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = 'rgba(0,255,0,1)'; // orientation
        for(var i = 0; i < o_neighbours.length; i += 1) {
            o_neighbours[i].render();
        }
        context.stroke();
        context.closePath();

        context.beginPath();
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = 'rgba(0,0,255,1)'; // attraction
        for(var i = 0; i < a_neighbours.length; i += 1) {
            a_neighbours[i].render();
        }
        context.stroke();
        context.closePath();
    }
    // animation frame completed
    renderFlag = true;
}


// Start on window load
//
//
canvas = document.getElementById("swarmCanvas");
context = canvas.getContext("2d");
cvs = document.getElementById("zonesDiagramCanvas");
ctx = cvs.getContext("2d");
cvs.width = 200;
cvs.height = 200;
particles = [];
// initialize arrays to hold neighbors of particle 0
r_neighbours = [];
o_neighbours = [];
a_neighbours = [];
// group direction
particles_theta = 0;
bounds = new Vector2D(0, 0),
canvas.width = bounds.x = window.innerWidth,
canvas.height = bounds.y = window.innerHeight,
monitor = new MouseMonitor(canvas),
hue = 0,
renderFlag = true;

// 3 zones model parameters
r_r = repulsionZone.value, // area of repulsion radius
r_o = orientationZone.value, // area of orientation radius
r_a = attractionZone.value; // area of attraction radius

settings = {
    particleNum: parseInt(numAgents.getAttribute('max')),
    fadeOverlay: true,
    rotateColor: false,
    staticColor: {r: 0, g: 75, b: 50},
    staticColorString: 'rgba(250, 149, 0, 1)'
};
width = canvas.width;
height = canvas.height;

window.addEventListener('load', function() {
      // set controls range
      turningSpeed.setAttribute('max', 0.1);
      attractionZone.setAttribute('max', 100);
      orientationZone.setAttribute('max', 100);
      repulsionZone.setAttribute('max',30);


      turningSpeed.value = 0.05;
      attractionZone.value = 50;
      orientationZone.value = 30;
      repulsionZone.value = 5;
      // generate a few particles
      generateParticles(settings.particleNum)
      // fill out zone diagram
      renderDiagram()
      // kick off animation
      render()
});