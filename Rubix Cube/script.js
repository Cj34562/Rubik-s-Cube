function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    #savepoint;
    constructor(pieces) {
        this.#cube = structuredClone(pieces);
        this.#savepoint = structuredClone(pieces);
        document.addEventListener("keydown", this.keyturn.bind(this));
        document.getElementById('scramble').addEventListener('click', this.scramble.bind(this))
        document.getElementById('solve').addEventListener('click', this.solve.bind(this))
        this.DisplayColors();
    }

    DisplayColors() {
        //add data-cell attribute
        for (let c of this.#cube) {
            for (let key in c.colors) {
                if (c.colors[key] != null) {
                let dc = 0;
                dc = 1 + c.position[2]*3 + c.position[1]
                if (key == 'B' || key == 'F') {dc = 1 + c.position[1]*3 + c.position[0]}
                if (key == 'R' || key == 'L') {dc = 1 + c.position[2]*3 + c.position[1]}
                if (key == 'U' || key == 'D') {dc = 1 + c.position[2]*3 + c.position[0]}

                let square = document.querySelector(`#${key} [data-cell="${dc}"]`);

                square.style.backgroundColor = c.colors[key];
                }
            }
            
        }
    }

    //save curr state of cube
    save() {this.#savepoint = structuredClone(this.#cube);}

    //revert to saved state of cube
    reverse(lst) {
        for (let move of lst.reverse()) {
            let clockwise = false;
            if (move.length != 1) {clockwise = true}
            this.turn(move[0], clockwise)
        }
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
        console.log(structuredClone(cubies))
    }

    keyturn(event) {
        const keyMap = {
            "w": ["U", true],     // U key -> Up clockwise
            "W": ["U", false],    // lowercase u -> Up counterclockwise
            "s": ["D", true],
            "S": ["D", false],
            "f": ["F", true],
            "F": ["F", false],
            "b": ["B", true],
            "B": ["B", false],
            "a": ["L", true],
            "A": ["L", false],
            "d": ["R", true],
            "D": ["R", false]
        };
        if (keyMap[event.key]) {
            const [face, clockwise] = keyMap[event.key];
            this.turn(face, clockwise);
            this.DisplayColors();
        }
        else if(event.key == "r") {this.scramble()}
        else if(event.key == "t") {this.solve()}
    }

    async turnmany (lst, wait) {
        for (let move of lst) {
            let clockwise = false;
            if (move.length == 1) {clockwise = true}
            this.turn(move[0], clockwise)

            if (wait) {
                await sleep(50)
                this.DisplayColors()
            }
        }
    }

    scramble() {
        let mods = [true, false, 2] //clockwise, anti, or half turn
        let temp = 0
        for (let i = 0; i < 20; i++) {
            let move = null;
            let mod;
            while (true) {
                move = this.#sides[Math.floor(Math.random() * this.#sides.length)];
                if (move != temp) break;
            }
            temp = move

            mod = mods[Math.floor(Math.random() * mods.length)];
            if (mod == 2) {
                this.turn(move, true);
                this.turn(move, true)
            }
            else {
                this.turn(move, mod)
            }

        }
        this.DisplayColors();
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

        this.save()
        let white_edge = []; //list of white edge cubies
        for (let cubie of this.#cube) {
            let f = Object.values(cubie['colors']).filter(x => x !== null);
            if (f.length == 2 && f.includes("white")) {white_edge.push(cubie)}
        }

        //Making yellow flower
        let seq = []
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
        
        let safety = 0
        while (!check_corners()) {
            safety ++
            if (safety > 10) {
                break
            }
            //console.log(white_corners)
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
                //solve easy edges (at top layer)
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
        safety = 10
        while(true) {
            safety++
            //console.log(safety)
            if (safety > 50) {break}
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
                            //console.log("test")
                        }
                    }
                }
                else {alg_convert(["L","U`","R","U","L`","U`","R`","U"], "F")}
            }
            else {break}
        }


        //Step 8: permutate yellow corners
        for (let corn of y_corner) {
            let safe = 0
            while (corn.colors["U"] != "yellow") {
                safe++
                if (safe>30) {break}
                //console.log(safe)
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


        this.#cube = this.#savepoint
        this.turnmany(finalfinalseq, true)
        //this.DisplayColors()
        
    }
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
//cube.turn('D', true)
//cube.turnmany(['D`', 'B', 'F`'])
cube.DisplayColors()

