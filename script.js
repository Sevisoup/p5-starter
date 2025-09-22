let FoodArray = [];
let BacteriaArray = [];
let bacteria;

class Food {
    constructor(x,y,size,dx,dy){
        this.pos = createVector(x, y);
        this.vel = createVector(dx, dy);
        this.size = size;
        this.food = circle(x,y,this.size);
    }
    movement() {

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
    display() {
        circle(this.pos.x, this.pos.y, this.size);
    }
}

class Bacteria extends Cell {
    constructor(x, y, size, dx, dy){
        super(x, y, size, dx, dy);
        super.display();
        this.speed = 0.001;
    }
    target() {
        if (FoodArray.length === 0) return;
        let closestfood;
        let mindist = Infinity;
        for(let food of FoodArray){
           this.dist = p5.Vector.dist(this.pos, food.pos);
            if (this.dist < mindist) {
                mindist = this.dist;
                closestfood = food;
            }
        }
        this.dir = p5.Vector.sub(closestfood.pos, this.pos);
        this.dir.setMag(this.speed);
        this.vel = this.dir;
        console.log('Bacteria pos:', this.pos.x, this.pos.y);
        console.log('Velocity:', this.vel.x, this.vel.y);
        console.log('Distance to target:', mindist);
    }
    update() {
        this.pos.add(this.vel);
    }
}

function createfood() {
    let food = new Food(Math.floor(Math.random() * windowWidth),Math.floor(Math.random() * windowHeight),10,Math.floor(Math.random() * 10),Math.floor(Math.random() * 10));
    FoodArray.push(food);
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);
    bacteria = new Bacteria(Math.floor(Math.random() * windowWidth),Math.floor(Math.random() * windowHeight),40,Math.floor(Math.random() * 10),Math.floor(Math.random() * 10));
    BacteriaArray.push(bacteria);
    for(let i = 0; i < 10; i++){
        createfood();
    }
}

function draw() {
    bacteria.target();
    bacteria.update();
    //bacteria.changeposition();
    //console.log(FoodArray);
    //console.log(BacteriaArray);
    
}