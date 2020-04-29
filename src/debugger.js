let debugMode = false;
let outputElement;

function activate(id) {
    debugMode = true;
    if (id) {
        outputElement = window.document.getElementById("mouselogDebugDiv");
        if (!outputElement) {
            console.log("Fail to find the output element.");
        }
    }
}

function write(info) {
    if (debugMode) {
        if (outputElement) {
            let p = document.createElement("p");
            p.style.display = "block";
            p.style.fontSize = "10px";
            p.style.margin = "2px";
            let t = document.createTextNode(info);
            p.appendChild(t);
            outputElement.appendChild(p);
        }
        console.log(info);
    }
}

export { activate, write };