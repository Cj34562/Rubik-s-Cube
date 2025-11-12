import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";


//OOP to track cube state
//Class Cube
class CubePiece {
    //init vars
    constructor(position, colors) {
        this.position = structuredClone(position);
        this.colors = colors;
        this.corr_pos = structuredClone(position)
    }
}

class Cube {
    //init vars
    //position = coord of CubePiece in a cube
    //colors = dict of colors and its direction
    #sides = ["U", "L", "F", "R", "D", "B"];
    #color  = {U:"yellow", L:"orange", F:"blue", R:"red", D:"white", B:"green"};
    #cube;
    #savepoint
    constructor(pieces) {
        this.#cube = structuredClone(pieces);
    }


    //turns the cube X number of times  NOTE: I THINK* turn doesent work like .5% of the time and idk why
    //Places it bugged at: white_corner solving, yellow corner solving, yellow corner orientating
    turn(face, clockwise) {
        let cubies = []
        for (let c of this.#cube) {
            if (c.colors[face] != null) {cubies.push(c)}
            }

        
        cubies.forEach(c => {
            if (face == 'U' || face == 'D') {
                let [x,y,z] = [0, c.position[1], 0]
                const {U,L,F,R,D,B} = c.colors;
                if(clockwise) c.colors = {U, L:B, F:L, R:F, D, B:R};
                else c.colors = {F:R, R:B, B:L, L:F, U,D};

                if (c.colors["R"]) x = 2;
                else if (!c.colors["L"]) x = 1;
                if (c.colors["B"]) z = 2;
                else if (!c.colors["F"]) z = 1;
                c.position = [x,y,z]           
                }

            if (face == 'L' || face == 'R') {
                let [x,y,z] = [c.position[0], 0, 0]
                const {U,L,F,R,D,B} = c.colors;
                if(clockwise) c.colors = {F:D, R, B:U, L, U:F, D:B};
                else c.colors = {U:B, L, F:U, R, D:F, B:D};

                if (c.colors["B"]) z = 2;
                else if (!c.colors["F"]) z = 1;
                if (c.colors["D"]) y = 2;
                else if (!c.colors["U"]) y = 1;
                c.position = [x,y,z]  
                }
  
                

            if (face == 'F' || face == 'B') {
                let [x,y,z] = [0, 0, c.position[2]]
                const {U,L,F,R,D,B} = c.colors;
                if(clockwise) c.colors = {F, B, U:L, R:U, D:R, L:D};
                else c.colors = {F, B, U:R, R:D, D:L, L:U};

                if (c.colors["R"]) x = 2;
                else if (!c.colors["L"]) x = 1;
                if (c.colors["D"]) y = 2;
                else if (!c.colors["U"]) y = 1;
                c.position = [x,y,z]    
                }
        });
    }

    turnmany (lst, wait) {
        for (let move of lst) {
            let clockwise = false;
            if (move.length == 1) {clockwise = true}
            this.turn(move[0], clockwise)

            if (wait) {
              continue
            }
        }
    }


    solve() {
        function equalPos(a, b) {
            return a.length === b.length && a.every((v, i) => v === b[i]);
        }

        //Step 1: Flower
        //Brute force by turning moves containing a white edge
        function check_flower(white_cubie) {
            for (let cubie of white_cubie) {
                if (cubie.colors['U'] != "white") {return false}
            }
            return true
        }

        let white_edge = []; //list of white edge cubies
        for (let cubie of this.#cube) {
            let f = Object.values(cubie['colors']).filter(x => x !== null);
            if (f.length == 2 && f.includes("white")) {white_edge.push(cubie)}
        }

        //Making yellow flower
        let seq = []
        this.#savepoint = structuredClone(this.#cube)
        while (!check_flower(white_edge)) {
            let only_hard_left = true;
            let face = null;
            for (let white of white_edge) {
                let hard = false;
                if (white.colors["U"] != "white") {
                    if (white.position[1] == 0 || (white.position[1] == 2 && white.colors["D"] != "white")) {
                        face = Object.keys(white.colors).find(f => white.colors[f] == "white");
                        hard = true;
                    }
                    else {face = Object.keys(white.colors).find(f => white.colors[f] && white.colors[f] != "white");}

                    let done = false;
                    while (!done) {
                        for (let cubie of this.#cube) {
                            if (cubie.colors[face] && cubie.colors["U"] && cubie.position.includes(1)) {
                                if (cubie.colors["U"] != "white") {
                                    done = true;
                                    break;
                                }
                                else {
                                    this.turn("U", true);
                                    seq.push('U');
                                }
                            }
                        }
                    }

                    while (white.colors["U"] != "white" && !hard) {
                        this.turn(face, true);
                        seq.push(face);
                        only_hard_left = false;
                    }

                }
            }
            if (only_hard_left) {
                this.turn(face, true);
                seq.push(face); 
            }
        }
        
        //Step 2: white cross
        let top_no = 4
        while (top_no > 0) {
            for (let white of white_edge) {
                for (let key of Object.keys(white.colors)) {
                    if (white.colors[key] &&  key != 'U') {
                        if (this.#color[key] == white.colors[key] && white.colors["D"] != "white") {
                            this.turnmany([key, key], false);
                            seq = [...seq, key, key];
                            top_no -= 1;
                        }
                    }
                }
            }
            if (top_no > 0) {
                this.turn("U", true)
                seq.push("U")
            }
        }

        let white_corners = []
        for (let cubie of this.#cube) {
            if (Object.keys(cubie.colors).find(c => cubie.colors[c] == "white")
            && !cubie.position.includes(1)) {white_corners.push(cubie)}
        }
        const check_corners = () => {
            for (let white of white_corners) {
                if (white.colors["D"] != "white") {return false}
            }
            return true
        }
        
        while (!check_corners()) {
            for (let white of white_corners) {
                const move_white_corner = () => {
                    while (!equalPos([white.position[0], white.position[2]], 
                    [white.corr_pos[0], white.corr_pos[2]])) {
                        this.turn("U", true);
                        seq.push("U")
                    }
                }

                const tryMoves = (poss_move, condition) => {
                    for (let move of poss_move) {
                        this.turnmany(move, false);

                        if (condition()) {
                            return move;
                        }
                        //undo
                        this.turnmany([...move, ...move, ...move], false);
                    }
                    return null;
                }
                
                //easy corners
                if (white.position[1] == 0 && white.colors['U'] != "white") {
                    move_white_corner();
                    let face = Object.keys(white.colors).find(c => white.colors[c] == "white")
                    let poss_move = [[face, "U", `${face}\``], [face, "U`", `${face}\``], 
                    [`${face}\``, "U", face], [`${face}\``, "U`", face]]

                    //insert white corner
                    let move = tryMoves(poss_move, () => {
                        return (
                            white.colors["D"] == "white" && white.position[0] == white.corr_pos[0] &&
                            white.position[1] == white.corr_pos[1] && white.position[2] == white.corr_pos[2]
                        );
                    });
                    if (move) {seq = [...seq, ...move];}
                }

                //corners facing up
                else if (white.colors["U"] == "white") {
                    move_white_corner()
                    let face = Object.keys(white.colors).find(c => white.colors[c] != "white"
                    && white.colors[c])
                    let poss_move = [[face, "U", `${face}\``], [face, "U`", `${face}\``], 
                    [`${face}\``, "U", face], [`${face}\``, "U`", face]]

                    let move = tryMoves(poss_move, () => {
                        return (white.colors["U"] != "white");
                    });
                    if (move) {seq = [...seq, ...move];}
                }

                //corners inserted to wrong pos
                else if (white.colors["D"] == "white" && !equalPos(white.position, white.corr_pos)) {
                    let face = Object.keys(white.colors).find(c => white.colors[c] != "white" &&
                    white.colors[c])
                    let poss_move = [[face, "U", `${face}\``], [face, "U`", `${face}\``], 
                    [`${face}\``, "U", face], [`${face}\``, "U`", face]]

                    let move = tryMoves(poss_move, () => {
                        return (white.colors["D"] != "white");
                    });
                    if (move) {seq = [...seq, ...move];}
                }

                else if (white.colors["D"] != "white" && white.position[1] == 2) {
                    let face = Object.keys(white.colors).find(c => white.colors[c] != "white" &&
                    white.colors[c] && c != "D")
                    let poss_move = [[face, "U", `${face}\``], [face, "U`", `${face}\``], 
                    [`${face}\``, "U", face], [`${face}\``, "U`", face]]

                    let move = tryMoves(poss_move, () => {
                        return (white.position[1] == 0 && white.colors["U"] != "white");
                    });
                    if (move) {seq = [...seq, ...move];}
                }
            }
        }

        //convert alg from front side to x side
        const alg_convert = (moves, side) => {
            let left_map = {L:"B", R:"F", F:"LLL", B:"RRR", LLL:"BBB", RRR:"FFF", FFF:"L", BBB:"R"}
            let side_map = {F:"L", R:"F", B:"R", L:"B"}
            let new_move = []
            for (let m of moves) {
                let move = m;
                let curr_face = "F"
                if (move.length == 2) {move = m.slice(0,1).repeat(3)}
                while (curr_face.slice(0,1) != side.slice(0,1) && !move.includes('U')) {
                    curr_face = side_map[curr_face]
                    move = left_map[move]
                }
                if (move.length == 3) {move = `${move.slice(0,1)}\``}
                new_move.push(move)
            }
            this.turnmany(new_move, false)
            seq = [...seq, ...new_move]
            //console.log(new_move)
        }
        //alg_convert(["U`","R","U","R`","U","F`","U`","F"], "R ")

        //Step 4: Second layer
        let l2_edge = []
        for (let cubie of this.#cube) {
            if (cubie.corr_pos[1] == 1 && cubie.corr_pos.filter(c => c == 1).length == 1) {
                l2_edge.push(cubie)
            }
        }

        let color_map = {blue:"red", red:"green", green:"orange", orange:"blue"}; //determine which side of the algorithm to use
        let side_map = {F:"R", R:"B", B:"L", L:"F"};

        outerWhile:
        while (true) {
            let unsolved_edge = [];
            let done = true;
            //check if solved edge
            for (let edge of l2_edge) {
                if (Object.keys(edge.colors).filter(c => this.#color[c] == edge.colors[c]).length < 2) {
                    unsolved_edge.push(edge)
                    done = false;
                }
            }
            if (done) {break outerWhile}

            let easy_done = true;
            for (let edge of l2_edge) {
                if (edge.colors["U"]) {
                    let curr_side = Object.keys(edge.colors).find(c => c != "U" && edge.colors[c])
                    let corr_side = Object.keys(this.#color).find(c => this.#color[c] == edge.colors[curr_side])
                    while (curr_side.slice(0,1) != corr_side.slice(0,1)) {
                        this.turn("U", true)
                        seq.push("U")
                        curr_side = Object.keys(edge.colors).find(c => c != "U" && edge.colors[c])
                    }

                    let top_col = edge.colors["U"]
                    if (color_map[edge.colors[curr_side]] == top_col) {//right alg
                        alg_convert(["U`","R","U","R`","U","F`","U`","F"], corr_side)
                    }
                    else {
                        alg_convert(["U","L","U`","L`","U`","F","U","F`"], corr_side)    
                    }
                    easy_done = false;

                }

                //Solve edges in the wrong pos but correct orientation
                else if (!equalPos(edge.corr_pos, edge.position))
                {
                    if (Object.keys(this.#color).find(c => this.#color[c] == edge.colors[c])) {
                        let temp = [Object.keys(this.#color).find(c => this.#color[c] == edge.colors[c]),
                        Object.keys(this.#color).find(c => this.#color[c] == edge.colors[c]), "U", "U"]
                        seq = [...seq, ...temp, ...temp, ...temp]
                        this.turnmany([...temp, ...temp, ...temp], false)
                        easy_done = false;
                    }
                }
            }

            //solve edges wrong orientation
            if (easy_done) {
                for (let edge of l2_edge) {
                    if (unsolved_edge.includes(edge)) {
                        let sides = Object.keys(edge.colors).filter(c => edge.colors[c])
                        if (side_map[sides[0]] == sides[1]) {
                            alg_convert(["U`","R","U","R`","U","F`","U`","F"], sides[0])
                        }
                        else {alg_convert(["U`","R","U","R`","U","F`","U`","F"], sides[1])}
                    }
                }
            }
        }

        //Step 5: Yellow Cross
        let y_cubie = []
        let y_edge = []
        let y_corner = []
        for (let cubie of this.#cube) {
            if (Object.keys(cubie['colors']).find(x => cubie.colors[x] == "yellow")) {
                y_cubie.push(cubie)
                if (Object.keys(cubie['colors']).filter(x => cubie.colors[x]).length == 3) {
                    y_corner.push(cubie);
                }
                else if (Object.keys(cubie['colors']).filter(x => cubie.colors[x]).length == 2) {
                    y_edge.push(cubie)
                }
            }
        }

        //determine curr yellow pattern
        for (let i=0;i<2;i++) {
            let y_up = y_edge.filter(e => e.colors["U"] == "yellow")
            if (y_up == 0) {
                let alg = ["F","R","U`","R`","U","F`","B`","U`","L`","U","L","B"]
                alg_convert(alg, "F")
            }
            else if (y_up.length == 2) {
                while (y_up.filter(y => equalPos(y.position, [0,0,1])).length == 0) {
                    this.turn("U", true)
                    seq.push("U")
                }

                if (y_up.filter(y => equalPos(y.position, [2,0,1])).length > 0) {
                    let alg = ["F","R","U`","R`","U","F`"]
                    alg_convert(alg, "F")
                }
                else {
                    if (y_up.filter(y => equalPos(y.position, [1,0,0])).length > 0) {
                        this.turnmany(["U"], false)
                        seq.push("U")
                    }

                    let alg = ["F","U`","R","U","R`","F`"]
                    alg_convert(alg, "F")
                }
            }
        }

        //Step 6: Solve yellow edge
        let edge_solved = false
        let corr_edge = null
        for (let i=0; i<4; i++) {
            let count = 0
            for (let edge of y_edge) {
                let temp = Object.keys(edge.colors).find(e => edge.colors[e] && edge.colors[e] != "yellow")
                if (this.#color[temp] == edge.colors[temp]) {
                    corr_edge = edge
                    count++;
                }
            }
            if (count == 1) {break}
            else if (count == 4) {edge_solved=true; break}
            else if (count != 1 && i == 3) {
                alg_convert(["R", "U`", "R`", "U`", "R", "U", "U", "R`"], "F");
                i = 0;
            }
            this.turn("U", true)
            seq.push("U")
        }

        while (!edge_solved) {
            let face = Object.keys(corr_edge.colors).find(e => corr_edge.colors[e] &&
            corr_edge.colors[e] != "yellow")
            alg_convert(["R", "U`", "R`", "U`", "R", "U", "U", "R`"], face)

            let count = 0
            for (let edge of y_edge) {
                let temp = Object.keys(edge.colors).find(e => edge.colors[e] && edge.colors[e] != "yellow")
                if (this.#color[temp] == edge.colors[temp]) {
                    corr_edge = edge
                    count++;
                }
            }
            if (count == 4) {edge_solved=true; break}
        }

        //Step 7: Solve yellow corners
        while(true) {
            let count = 0
            let corr_corn = 0
            for (let corn of y_corner) {
                if (equalPos(corn.position, corn.corr_pos)) {
                    count += 1
                    corr_corn = corn
                }
            }
            if (count != 4) {
                if (corr_corn != 0) {
                    for (let face of Object.keys(corr_corn.colors).filter(c => corr_corn.colors[c])) {
                        if (side_map[face] && 
                        Object.keys(corr_corn.colors).filter(c => corr_corn.colors[c]).includes(side_map[face])) {
                            alg_convert(["L","U`","R","U","L`","U`","R`","U"], face)
                        }
                    }
                }
                else {alg_convert(["L","U`","R","U","L`","U`","R`","U"], "F")}
            }
            else {break}
        }


        //Step 8: permutate yellow corners
        for (let corn of y_corner) {
            while (corn.colors["U"] != "yellow") {
                if (!equalPos(corn.position, [2,0,0])) {
                    this.turn("U", true)
                    seq.push("U")
                }
                else {
                    alg_convert(["R`", "D`","R","D","R`", "D`","R","D"], "F")
                }
            }
        }

        //Step 9:Finish
        while (!equalPos(y_corner[0].position, y_corner[0].corr_pos)) {alg_convert(["U"], "F")}
        

        let final_seq = []
        let finalfinalseq = []
        let counter = 1
        let ptr_A = 0
        let ptr_B = 1
        console.log(seq)

        while (ptr_B < seq.length+1) {
            if (seq[ptr_A] == seq[ptr_B]) {counter++}
            else {
                if (counter == 3) {
                    if (seq[ptr_A].length == 1) {final_seq.push(`${seq[ptr_A]}\``)}
                    else {final_seq.push(seq[ptr_A])}
                }

                else {final_seq = [...final_seq, ...seq.slice(ptr_A, ptr_B)]}
                ptr_A = ptr_B; counter = 1
            }

            ptr_B++;
        }

        ptr_A = 0
        ptr_B = 1

        while (ptr_B < final_seq.length) {
            if (final_seq[ptr_B][0] == final_seq[ptr_A][0] && 
                final_seq[ptr_B].length + final_seq[ptr_A].length == 3) {
                ptr_A++;ptr_B++;
            }
            else {finalfinalseq.push(final_seq[ptr_A])}
            ptr_A++
            ptr_B++
        }
        finalfinalseq.push(final_seq[final_seq.length - 1])

        this.#cube = structuredClone(this.#savepoint)
        return final_seq
        
    }

    cubeState() {return structuredClone(this.#cube)}
}


const dir = ["U", "L", "F", "R", "D", "B"];
const colors = { U:'yellow', D:'white', F:'blue', B:'green', L:'orange', R:'red' };


let temp = [];

for (let x = 0; x < 3; x++) {
  for (let y = 0; y < 3; y++) {
    for (let z = 0; z < 3; z++) {
        let color = {};

        color.D = (y == 2)? colors.D : null;
        color.U = (y === 0)? colors.U : null;
        color.B = (z === 2)? colors.B : null;
        color.F = (z === 0)? colors.F : null;
        color.L = (x === 0)? colors.L : null;
        color.R = (x === 2)? colors.R : null;

        temp.push(new CubePiece([x, y, z], color));
        }
    }
}

let cube = new Cube(temp)
let clone = structuredClone(cube)




//3D rendering
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 20);
camera.position.set(5,5,5);
camera.lookAt(0,0,0);

//orbit controls (use mouse to rotate cube)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth rotation
controls.dampingFactor = 0.5;
controls.enableZoom = true;    // optional, allow zoom

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Face colors
const faceColors = [
  0xff0000, // Right = red
  0xff8000, // Left = orange
  0xffff00, // Top = yellow
  0xffffff, // Bottom = white
  0x0000ff, // Front = blue
  0x00ff00  // Back = green
];

// Cubies group
const cubes = [];
const cubeGroup = new THREE.Group();
const cubeUp = new THREE.Group();
const cubeDown = new THREE.Group();
const cubeLeft = new THREE.Group();
const cubeRight = new THREE.Group();
const cubeFront = new THREE.Group();
const cubeBack = new THREE.Group();


//return mats with inner faces black
function getMat(x, y, z) {
    let colors = [null, null, null, null, null, null];
    if (x != -1) {colors[1] = "black"}
    if (x != 1) {colors[0] = "black"}
    if (y != -1) {colors[3] = "black"}
    if (y != 1) {colors[2] = "black"}
    if (z != -1) {colors[5] = "black"}
    if (z != 1) {colors[4] = "black"}

    let mats = []
    for (let i = 0; i <6; i++) {
        const color = colors[i] == "black" ? 0x000000 : faceColors[i];
        mats.push(new THREE.MeshStandardMaterial({ color, flatShading: true }));
    }
    return mats
}

for (let x=-1; x<=1; x++) {
  for (let y=-1; y<=1; y++) {
    for (let z=-1; z<=1; z++) {
        
        //materials = [MeshStandardMaterial({ color: red, flatShading: true }, orange, yellow, etc]
        const materials = getMat(x, y, z)

        //THREE.Mesh(geo, material)
        //auto assign material in the list to the faces in order of RLTDFB
        const geo = new THREE.BoxGeometry(1,1,1)
        const cubie = new THREE.Mesh(geo, materials);

        //adding outline to cubies
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
        );
        cubie.add(line);

        cubie.position.set(x*1.02, y*1.02, z*1.02);
        cubie.userData.pos = { x, y, z }
        cubeGroup.add(cubie);
        cubes.push(cubie);
    }
  }
}

scene.add(cubeGroup,cubeBack,cubeDown,cubeFront,cubeLeft,cubeRight, cubeUp);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 2); // soft white light, half intensity
scene.add(ambientLight);

let rotating = false;
let rotationProgress = 0;
let remaining = 0;
var queue = [];

function WorldPosition (cube) {
    const worldPos = new THREE.Vector3();
    cube.getWorldPosition(worldPos);
    worldPos.x = Math.round(worldPos.x * 100) / 100;
    worldPos.y = Math.round(worldPos.y * 100) / 100;
    worldPos.z = Math.round(worldPos.z * 100) / 100;
    return worldPos
}

document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() == 'w') queue.push(e.key);
    
  if (e.key.toLowerCase() == 's') queue.push(e.key);

  if (e.key.toLowerCase() == 'a') queue.push(e.key);

  if (e.key.toLowerCase() == 'd') queue.push(e.key);

  if (e.key.toLowerCase() == 'f') queue.push(e.key);

  if (e.key.toLowerCase() == 'b') queue.push(e.key);
})

// Animation loop
let clockwise = true
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // required for damping
  //animate runs each frame, speed = rads/frame
  if (rotating == true) {
    const groups = [
      { group: cubeUp, axis: 'y' },
      { group: cubeDown, axis: 'y' },
      { group: cubeLeft, axis: 'x' },
      { group: cubeRight, axis: 'x' },
      { group: cubeFront, axis: 'z' },
      { group: cubeBack, axis: 'z' }
    ];

    groups.forEach(({ group, axis }) => {
      if (group.children.length > 0) {
        //rotate 90 degree
        let speed = 0;
        remaining = Math.PI/2 - rotationProgress;
        if (remaining < 0) remaining = 0;
        speed = Math.min(0.5, remaining);
        if (clockwise) group.rotation[axis] += speed;
        else group.rotation[axis] -= speed
        rotationProgress += 0.5;

        //detach once rotate finish
        if (rotationProgress >= Math.PI/2) {
          rotating = false;
          for (const cube of [...group.children]) cubeGroup.attach(cube);
        }
      }
    });
  }

  //pops the queue and perpare to execute move
  else if (queue.length > 0) {
    const first = queue.shift()
    clockwise = first.toLowerCase() != first ? false:true
    const dict = [{"w":cubeUp, "s":cubeDown, "a":cubeLeft, "d":cubeRight, "f":cubeFront, "b":cubeBack},
    {"w": "y", "s":"y", "a":"x", "d":"x", "f":"z", "b":"z"},
    {"w": 1.02, "s":-1.02, "a":-1.02, "d":1.02, "f":1.02, "b":-1.02},
    {"w": "U", "s":"D", "a":"L", "d":"R", "f":"F", "b":"B"}]
    const group = dict[0][first.toLowerCase()];
    const axes = dict[1][first.toLowerCase()];
    const val = dict[2][first.toLowerCase()];
    rotating = true;
    rotationProgress = 0;
    remaining = 0;
    cube.turn(dict[3][first.toLowerCase()], clockwise)
    if (first.toLowerCase() != "s" && first.toLowerCase() != "w") clockwise = !clockwise;

    for (const cube of [...cubeGroup.children]) {
      if (WorldPosition(cube)[axes] == val) {group.attach(cube)}
    }
  }

  renderer.render(scene, camera);
}

animate();

renderer.render(scene, camera);

//Scramble
const scramble = document.getElementById('scramble');

// attach a click event listener
scramble.addEventListener('click', () => {
  let prev = "o"
  for (let i = 0;i < 20; i++) {
    const list = ['w','a','s','d','f','b','W','A','S','D','F','B'];
    const num = Math.floor(Math.random() * 2) + 1;
    
    //no 2 same move in a row
    let key_
    do {
      key_ = list[Math.floor(Math.random() * list.length)];
    } while (key_.toLowerCase() == prev.toLowerCase())
    
      prev = key_

    for (let i=0;i<num;i++) {
      const event = new KeyboardEvent('keydown', { key: key_, bubbles: true });
      document.dispatchEvent(event); 
    }
  }
});


//Solve
const Solve = document.getElementById('solve');
let sides = ["R", "L", "U", "D", "F", "B"]
let hex_map = {16744448:"orange", 16777215:"white", 65280:"green", 255:"blue", 16776960:"yellow", 16711680:"red", 0:"black"}
Solve.addEventListener('click', () => {
    console.log(cube.cubeState())
  for (let cubie of [...cubeGroup.children]) {
    let color = {}
    for (let i=0;i<6;i++) {
      color[sides[i]] = hex_map[cubie.material[i].color.getHex()] == "black" ? null : hex_map[cubie.material[i].color.getHex()];
    }
    //console.log(cube.)
  }
  let seq = cube.solve()
  let move_map = {"F":"f", "F`":"F", "B":"b", "B`":"B", "U":"w", "U`":"W", "D":"s", "D`":"S", "L":"a", "L`":"A", "R":"d", "R`":"D"}
  for (let move of seq) {
    const event = new KeyboardEvent('keydown', { key: move_map[move], bubbles: true });
    document.dispatchEvent(event); 
  }
  console.log(seq)
  console.log(cube.cubeState())

  //cube = clone
});




