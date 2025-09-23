let FoodArray = [];
let BacteriaArray = [];
let bacteria;
let foodtimer = 0;

class Food {
    constructor(x,y,size,dx,dy){
        this.pos = createVector(x, y);
        this.vel = createVector(dx, dy);
        this.size = size;
        this.nutrition = 1;
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
        this.starvation = 0.2;
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

        //WARNING: CONFUSING MATH I HALF UNDERSTAND

        // Desired direction
        let desireddirection = p5.Vector.sub(closestfood.pos, this.pos).normalize();

        // Current direction
        let currentdirection = this.vel.copy().normalize();

        // 3. Smoothly rotate toward desiredDir
        let angledifference = desireddirection.heading() - currentdirection.heading();

        // Ensure shortest rotation path
        angledifference = atan2(sin(angledifference), cos(angledifference));

        // 4. Limit turn speed * absolute value of the angle difference
        let maxturnangle = radians(5) * abs(angledifference);
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

    binarydivision() {
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
        this.saturation < 0;
    }

    update() {
        this.pos.add(this.vel);
    }

    display() {
        noStroke();
        circle(this.pos.x, this.pos.y, this.size);
        this.saturation -= (this.starvation/60);
    }
}

function createfood() {
    let food = new Food(Math.floor(Math.random() * windowWidth),Math.floor(Math.random() * windowHeight),10,Math.floor(Math.random() * 10),Math.floor(Math.random() * 10));
    FoodArray.push(food);
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);
    bacteria = new Bacteria(Math.floor(Math.random() * windowWidth),Math.floor(Math.random() * windowHeight),25,Math.floor(Math.random() * 4),Math.floor(Math.random() * 4));
    BacteriaArray.push(bacteria);
    for(let i = 0; i < 10; i++) {
        createfood;
    }
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
        b.binarydivision();
        b.update();
        b.display();
        b.handlecollision();

        if(b.dead()) {
            BacteriaArray.splice(i, 1);
        }
    }

    console.log(FoodArray);
    console.log(BacteriaArray);
    
}