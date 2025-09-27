let FoodArray = [];
let BacteriaArray = [];
let ArchaeaArray = [];
let bacteria;
let foodtimer = 0;
let archaeaspawned = false;

class Food {
    constructor(x,y,size,dx,dy){
        this.pos = createVector(x, y);
        this.vel = createVector(dx, dy);
        this.size = size;
        this.nutrition = 0.5;
    }

    display() {
        noStroke();
        this.food = circle(this.pos.x,this.pos.y,this.size);
    }
}

class Cell {
    constructor(x,y,size,dx,dy) {
        this.pos = createVector(x, y);
        this.vel = createVector(dx, dy);
        this.size = size;
    }

    changeposition() {
        this.vel.x = (this.pos.x >= windowWidth || this.pos.x <= 0) ? this.vel.x *= -1 : this.vel.x;
        this.vel.y = (this.pos.y >= windowHeight || this.pos.y <= 0) ? this.vel.y *= -1 : this.vel.y;
    }
}

class Bacteria extends Cell {
    constructor(x, y, size, dx, dy) {
        super(x, y, size, dx, dy);
        this.originalsize = size;
        this.speed = 4;
        this.saturation = 1;
        this.starvation = 0.1;
        this.growth = 1.2;
        this.nutrition = 1;
        this.targetedfood = null;
        this.targetcooldown = 0;
    }

    target() {
        if (this.targetcooldown > 0) {
            this.targetcooldown--;

            for (let i = FoodArray.length - 1; i >= 0; i--) {
                let food = FoodArray[i];
                let d = p5.Vector.dist(this.pos, food.pos);
                if (d < (this.size / 2 + food.size / 2)) {
                    FoodArray.splice(i, 1);
                    this.saturation += food.nutrition;
                    this.nutrition += food.nutrition;
                    this.size *= this.growth;
                }
            }

            return;
        }

        // Cooldown

        if (FoodArray.length === 0) return;
        let closestfood;
        let mindistance = Infinity;
        for (let food of FoodArray){
           this.distance = p5.Vector.dist(this.pos, food.pos);
            if (this.distance < mindistance) {
                mindistance = this.distance;
                closestfood = food;
                this.targetedfood = food;
            }
        }

        // Find closest "food" object ^^^

        if (this.targetedfood && !FoodArray.includes(this.targetedfood)) {
            this.targetedfood = null;
            this.targetcooldown = 60; // 1 second
            return;
        }

        // If target eaten, enter cooldown

        // Desired direction
        let desireddirection = p5.Vector.sub(closestfood.pos, this.pos).normalize();

        // Current direction
        let currentdirection = this.vel.copy().normalize();

        // 3. Smoothly rotate toward desired direction
        let angledifference = desireddirection.heading() - currentdirection.heading();

        // Ensure shortest rotation path
        angledifference = atan2(sin(angledifference), cos(angledifference));

        // 4. Limit turn speed * absolute value of the angle difference
        let maxturnangle = radians(5) * abs(angledifference) ** 1.2;
        angledifference = constrain(angledifference, -maxturnangle, maxturnangle);

        // 5. Angle change
        let anglechange = currentdirection.heading() + angledifference;
        this.vel = p5.Vector.fromAngle(anglechange).mult(this.speed);

        for (let i = FoodArray.length - 1; i >= 0; i--) {
            let food = FoodArray[i];
            let d = p5.Vector.dist(this.pos, food.pos);
            if (d < (this.size / 2 + food.size / 2)) {
                FoodArray.splice(i, 1);
                this.saturation += food.nutrition;
                this.nutrition += food.nutrition;
                this.size *= this.growth;
            }
        }

        // Eat Food ^^^

        /*
        console.log('Saturation:',this.saturation);
        console.log('Bacteria pos:', this.pos.x, this.pos.y);
        console.log('Velocity:', this.vel.x, this.vel.y);
        console.log('Distance to target:', mindistance);
        */
    }

    binaryfission() {
        this.size = this.originalsize;
        if (this.saturation >= 3) {
            this.nutrition = 1;
            this.saturation = 1;

            let basedirection = this.vel.copy().normalize();

            let direction1 = basedirection.copy().rotate(radians(30)).mult(2);
            let direction2 = basedirection.copy().rotate(radians(-30)).mult(2);

            let child = new Bacteria(this.pos.x,this.pos.y,this.size,direction1.x,direction1.y);

            this.vel = direction2;

            this.targetcooldown = 120;
            child.targetcooldown = 120;

            BacteriaArray.push(child);
        }
    }

    handlecollision() {
        for (let other of BacteriaArray) {
            if (other !== this) {
                let d = p5.Vector.dist(this.pos, other.pos);
                let mindistance = (this.size + other.size) / 2;
                if (d < mindistance) {
                    let overlap = mindistance - d;
                    let bouncedirection = p5.Vector.sub(this.pos, other.pos).normalize();
                    let relativevel = p5.Vector.sub(this.vel, other.vel);
                    let approachspeed = relativevel.dot(bouncedirection);

                    if (approachspeed < 0) {
                        this.pos.add(bouncedirection.copy().mult(overlap / 2));
                        other.pos.sub(bouncedirection.copy().mult(overlap / 2));

                        this.vel.sub(p5.Vector.mult(bouncedirection, 3 * approachspeed));
                        other.vel.add(p5.Vector.mult(bouncedirection, 3 * approachspeed));

                        this.vel.limit(this.speed);
                        other.vel.limit(other.speed);
                    }
                    
                    this.vel.limit(this.speed);
                    other.vel.limit(other.speed);
                }
            }
        }
    }

    dead() {
        return this.saturation < 0;
    }

    update() {
        this.pos.add(this.vel);
        this.changeposition();
    }

    display() {
        noStroke();
        circle(this.pos.x, this.pos.y, this.size);
        this.saturation -= (this.starvation/60);
    }
}

class Archaea extends Cell {
    constructor(x, y, size, dx, dy) {
        super(x, y, size, dx, dy);
        this.originalsize = size;
        this.speed = 10;
        this.saturation = 1;
        this.starvation = 0.1;
        this.growth = 1.2;
        this.nutrition = 1;

        this.random = [];
        for(let i = 0; i < 12; i++){
            this.random[i] = Math.random();
        }

        this.chargetimer = 240;
        this.dashtimer = 0;
        this.dashelapsed = 0;
        this.dashduration = 60;
        this.direction = createVector(0, 0);
    }

    target() {
        for (let i = BacteriaArray.length - 1; i >= 0; i--) {
            let bacteria = BacteriaArray[i];
            let d = p5.Vector.dist(this.pos, bacteria.pos);
            if (d < (this.size / 2 + bacteria.size / 2)) {
                BacteriaArray.splice(i, 1);
                this.saturation += bacteria.nutrition;
                this.nutrition += bacteria.nutrition;
                this.size *= this.growth;
            }
            console.log(this.size,bacteria.size);
        }

        // Devour the bacteria ^^^

        if (BacteriaArray.length === 0) return;
        let closestbacteria;
        let mindistance = Infinity;
        for (let bacteria of BacteriaArray){
            this.distance = p5.Vector.dist(this.pos, bacteria.pos);
            if (this.distance < mindistance) {
                mindistance = this.distance;
                closestbacteria = bacteria;
            }
        }

        // Find closest "bacteria" object ^^^

        if (this.chargetimer > 0) {
            this.chargetimer--;
            this.vel.set(0, 0);
            return;
        }

        if (this.chargetimer <= 0 && this.dashtimer <= 0 && closestbacteria) {
            this.direction = p5.Vector.sub(closestbacteria.pos, this.pos).normalize();
            this.dashtimer = this.dashduration;
            this.dashelapsed = 0;
        }

        if (this.dashtimer > 0 && this.chargetimer <= 0) {
            let t = this.dashelapsed / this.dashduration;
            let speedcoefficient = easeoutsine(t);

            let speed = this.speed * speedcoefficient;
            this.vel = this.direction.copy();
            this.vel.mult(speed);

            this.dashtimer--;
            this.dashelapsed++;

            if (this.dashtimer <= 0) {
                this.chargetimer = 240;
                this.vel.set(0, 0);
            }
            return;
        }
    }

    binaryfission() {
        this.size = this.originalsize;
        if (this.saturation >= 3) {
            this.nutrition = 1;
            this.saturation = 1;

            let basedirection = this.vel.copy().normalize();

            let direction1 = basedirection.copy().rotate(radians(30)).mult(2);
            let direction2 = basedirection.copy().rotate(radians(-30)).mult(2);

            let child = new Archaea(this.pos.x,this.pos.y,this.size,direction1.x,direction1.y);

            this.vel = direction2;

            ArchaeaArray.push(child);
        }
    }

    handlecollision() {
        for (let other of ArchaeaArray) {
            if (other !== this) {
                let d = p5.Vector.dist(this.pos, other.pos);
                let mindistance = (this.size + other.size) / 2;
                if (d < mindistance) {
                    let overlap = mindistance - d;
                    let bouncedirection = p5.Vector.sub(this.pos, other.pos).normalize();
                    let relativevel = p5.Vector.sub(this.vel, other.vel);
                    let approachspeed = relativevel.dot(bouncedirection);

                    if (approachspeed < 0) {
                        this.pos.add(bouncedirection.copy().mult(overlap / 2));
                        other.pos.sub(bouncedirection.copy().mult(overlap / 2));

                        this.vel.sub(p5.Vector.mult(bouncedirection, 3 * approachspeed));
                        other.vel.add(p5.Vector.mult(bouncedirection, 3 * approachspeed));

                        this.vel.limit(this.speed);
                        other.vel.limit(other.speed);
                    }
                    
                    this.vel.limit(this.speed);
                    other.vel.limit(other.speed);
                }
            }
        }
    }

    display() {
        noStroke();

        // North
        this.l2 = createVector(this.pos.x + this.size / 2,this.pos.y);
        this.r2 = createVector(this.pos.x - this.size / 2,this.pos.y);
        this.t2 = createVector(plusorminus(this.pos.x,((this.random[0] + 0.3) * 15),this.random[8]),this.pos.y + this.size * 2 * ((this.random[1] + 0.3) * 1.1));

        // West
        this.l3 = createVector(this.pos.x,this.pos.y + this.size / 2);
        this.r3 = createVector(this.pos.x,this.pos.y - this.size / 2);
        this.t3 = createVector(this.pos.x - this.size * 2 * ((this.random[2] + 0.3) * 1.1),plusorminus(this.pos.y,((this.random[3] + 0.3) * 15),this.random[9]));

        // South
        this.l1 = createVector(this.pos.x + this.size / 2,this.pos.y);
        this.r1 = createVector(this.pos.x - this.size / 2,this.pos.y);
        this.t1 = createVector(plusorminus(this.pos.x,((this.random[4] + 0.3) * 15),this.random[10]),this.pos.y + this.size * 2 * ((this.random[5] + 0.3) * 1.1));

        // East
        this.l4 = createVector(this.pos.x,this.pos.y + this.size / 2);
        this.r4 = createVector(this.pos.x,this.pos.y - this.size / 2);
        this.t4 = createVector(this.pos.x + this.size * 2 * ((this.random[6] + 0.3) * 1.1),plusorminus(this.pos.y,((this.random[7] + 0.3) * 15),this.random[11]));

        // Northwest
        this.l5 = createVector(this.pos.x - this.size / 3,this.pos.y + this.size / 3);
        this.r5 = createVector(this.pos.x + this.size / 3,this.pos.y - this.size / 3);
        this.t5 = createVector(this.pos.x - this.size * Math.sqrt(2),this.pos.y - this.size * Math.sqrt(2));

        // Southwest
        this.l6 = createVector(this.pos.x + this.size / 3,this.pos.y + this.size / 3);
        this.r6 = createVector(this.pos.x - this.size / 3,this.pos.y - this.size / 3);
        this.t6 = createVector(this.pos.x - this.size * Math.sqrt(2),this.pos.y + this.size * Math.sqrt(2));

        // Southeast
        this.l7 = createVector(this.pos.x - this.size / 3,this.pos.y + this.size / 3);
        this.r7 = createVector(this.pos.x + this.size / 3,this.pos.y - this.size / 3);
        this.t7 = createVector(this.pos.x + this.size * Math.sqrt(2),this.pos.y + this.size * Math.sqrt(2));

        // Northeast
        this.l8 = createVector(this.pos.x + this.size / 3,this.pos.y + this.size / 3);
        this.r8 = createVector(this.pos.x - this.size / 3,this.pos.y - this.size / 3);
        this.t8 = createVector(this.pos.x + this.size * Math.sqrt(2),this.pos.y - this.size * Math.sqrt(2));

        triangle(this.l1.x,this.l1.y,this.r1.x,this.r1.y,this.t1.x,this.t1.y);
        triangle(this.l2.x,this.l2.y,this.r2.x,this.r2.y,this.t2.x,this.t2.y);
        triangle(this.l3.x,this.l3.y,this.r3.x,this.r3.y,this.t3.x,this.t3.y);
        triangle(this.l4.x,this.l4.y,this.r4.x,this.r4.y,this.t4.x,this.t4.y);
        triangle(this.l5.x,this.l5.y,this.r5.x,this.r5.y,this.t5.x,this.t5.y);
        triangle(this.l6.x,this.l6.y,this.r6.x,this.r6.y,this.t6.x,this.t6.y);
        triangle(this.l7.x,this.l7.y,this.r7.x,this.r7.y,this.t7.x,this.t7.y);
        triangle(this.l8.x,this.l8.y,this.r8.x,this.r8.y,this.t8.x,this.t8.y);

        circle(this.pos.x, this.pos.y, this.size);

        this.saturation -= (this.starvation / 60);
    }

    update() {
        this.pos.add(this.vel);
    }

    dead() {
        return this.saturation < 0;
    }
}

function createfood() {
    let food = new Food(Math.floor(Math.random() * windowWidth),Math.floor(Math.random() * windowHeight),10,Math.floor(Math.random() * 10),Math.floor(Math.random() * 10));
    FoodArray.push(food);
}

function plusorminus (x,y,z) {
    return (z > 0.5) ? x + y : x - y;
}

function easeoutsine(t) {
    return Math.sin((1 - t) * (Math.PI / 2));
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);
    bacteria = new Bacteria(Math.floor(Math.random() * windowWidth),Math.floor(Math.random() * windowHeight),25,Math.floor(Math.random() * 4),Math.floor(Math.random() * 4));
    BacteriaArray.push(bacteria);
}

function draw() {
    background(0);

    foodtimer++;
    if (foodtimer >= 10) {
        createfood();
        foodtimer = 0;
    }

    for (let food of FoodArray) {
        food.display();
    }

    for (let i = 0; i < BacteriaArray.length; i++) {
        let b = BacteriaArray[i];
        b.target();
        b.binaryfission();
        b.update();
        b.display();
        b.handlecollision();

        if(b.dead()) {
            BacteriaArray.splice(i, 1);
        }
    }

    if(BacteriaArray.length >= 15 && archaeaspawned == false){
        archaea = new Archaea(Math.floor(Math.random() * windowWidth),Math.floor(Math.random() * windowHeight),25,Math.floor(Math.random() * 4),Math.floor(Math.random() * 4));
        ArchaeaArray.push(archaea);
        archaeaspawned = true;
    }

    for (let i = 0; i < ArchaeaArray.length; i++) {
        let a = ArchaeaArray[i];
        a.target();
        a.binaryfission();
        a.update();
        a.display();
        a.handlecollision();

        if(a.dead()) {
            ArchaeaArray.splice(i, 1);
        }
    }

    console.log(FoodArray);
    console.log(BacteriaArray);
    console.log(ArchaeaArray);
    
}