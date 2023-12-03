var global_var = 10;    // var is not block scoped and it is best
                        // to avoid using it.
let x, y, z;    //statement 1
const PI = 3.14;        // const is not variable.
x = 5;          //statement 2
y = 6;          //statement 3
z = x + y;      //statement 4

console.log(`printing x: ${x}`); // print to console

// object is the basis of JSON
let test_object = {
    name: "Joe",
    age: 20,
    combine: function() {
        return concat(this.name, this.age)
    }
};

z += test_object["age"];

// template literals
let second_test = `result is ${z + test_object.age}!`

{
    // drawing on canvas in HTML
    let myCanvas = document.getElementById("myCanvas");
    let ctx = myCanvas.getContext("2d");

    // draw a line
    ctx.moveTo(5, 5);
    ctx.lineTo(195, 95);
    ctx.stroke();

    // draw a circle
    ctx.beginPath();
    ctx.arc(95, 50, 40, 0, 2 * Math.PI);
    ctx.stroke();

    // draw text
    ctx.font = "30px Kozuka Gothic Pro";
    ctx.fillText("Hello World", 10, 65);
}

{
    // logical operators
    true && true;   // true
    true || false;  // true (or)
    true != false;  // true (not equal)

    // bitwise
    5 & 1;  // 1, same as 0101 & 0001 == 0001
    5 << 1; // 10, same as 0101 << 1 == 1010

    // block scope
    let z = "some string";
}

debugger;  // breakpoint
// concatenate z to string
let test_string = "Hello World!" + " " + z + " " + second_test;

document.getElementById("demo").innerHTML = test_string;