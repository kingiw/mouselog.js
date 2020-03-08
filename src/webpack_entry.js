// Webpack cannot simply export an ES6 class
// So wrapping the class constructor is a must
import Mouselog from "./index";

function init() {
    let res = new Mouselog();
    return res;
}

export {init};