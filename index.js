const uuidv4 = require('uuid/v4');
const Uploader = require('./uploader');
let { config, buildConfig } = require('./config');


let targetEvents = [
    "mousemove",
    "mousedown",
    "mouseup",
    "mouseclick",
    "dblclick",
    "contextmenu",
    "wheel",
    "torchstart",
    "touchmove",
    "touchend"
];

let uploader;
let impressionId;
let eventsList;
let pageLoadTime;
let uploadIdx;
let uploadInterval; // For "periodic" upload mode
let uploadTimeout; // For "mixed" upload mode

function getRelativeTimestampInSeconds() {
    let diff = new Date() - pageLoadTime;
    return Math.trunc(diff) / 1000;
}

function getButton(btn) {
    if (btn === '2') {
        return 'Right';
    } else {
        return ""
    }
}

function newTrace() {
    let trace = {
        id: '0',
        idx: uploadIdx,
        url: window.location.hostname ? window.location.hostname : "localhost",
        path: window.location.pathname,
        width: document.body.scrollWidth,
        height: document.body.scrollHeight,
        pageLoadTime: pageLoadTime,
        label: -1,
        guess: -1,
        events: []
    } 
    uploadIdx += 1;
    return trace;
}

function uploadTrace() {
    let trace = newTrace();
    trace.events = eventsList;
    eventsList = [];
    return uploader.upload(trace); // This is a promise
}

function periodUploadTimeout() {
    clearTimeout(uploadTimeout);
    uploadTimeout = setTimeout(() => {
        if (eventsList.length > 0) {
            uploadTrace();
        }
    }, config.uploadPeriod);
}

function periodUploadInterval() {
    clearInterval(uploadInterval);
    uploadInterval = setInterval(() => {
        if (eventsList.length != 0) {
            uploadTrace();
        }
    }, config.uploadPeriod);
}

function mouseHandler(evt) {
    // PC's Chrome on Mobile mode can still receive "contextmenu" event with zero X, Y, so we ignore these events.
    if (evt.type === 'contextmenu' && evt.pageX === 0 && evt.pageY === 0) {
        return;
    }
    let x = evt.pageX;
    let y = evt.pageY;
    if (x === undefined) {
        x = evt.changedTouches[0].pageX;
        y = evt.changedTouches[0].pageY;
    }
    let tmpEvt = {
        id: eventsList.length, 
        timestamp: getRelativeTimestampInSeconds(),
        type: evt.type,
        x: x,
        y: y,
        button: getButton(evt.button)
    }

    if (evt.type == "wheel") {
        tmpEvt.deltaX = evt.deltaX;
        tmpEvt.deltaY = evt.deltaY;
    }
    eventsList.push(tmpEvt);

    if ( config.uploadMode == "event-triggered" && eventsList.length % config.frequency == 0 ) {
        uploadTrace();
    }

    if ( config.uploadMode == "mixed" && eventsList.length % config.frequency == 0) {
        periodUploadTimeout();
        uploadTrace();
    }
}

function clearBuffer() {
    eventsList = [];
}

// Initialize the mouselog
function init(params) {
    clearBuffer();
    pageLoadTime = new Date();
    uploadIdx = 0;
    uploader = new Uploader();
    impressionId = uuidv4();
    uploader.setImpressionId(impressionId);
    if (buildConfig(params)) {
        // Async: Upload an empty data to ofetch config from backend
        uploadTrace().then( result => {
            if (result.status === 0) { // Config is updated successfully
                resetCollector();
            } else {
                console.log(result.msg);
                console.log("Fail to overwrite config with server config.")
            }
        });
        onbeforeunload = (evt) => {
            if (eventsList.length != 0) {
                uploadTrace();
            }
        }
        return {status: 0, msg: `Invalid configuration.`};
    } else {
        return {status: -1, msg: `Invalid configuration.`}
    }
}

function runCollector() {
    targetEvents.forEach( s => {
        window.document.addEventListener(s, (evt) => mouseHandler(evt));
    });

    if (config.uploadMode === "periodic") {
        periodUploadInterval();
    } 

    if (config.uploadMode == "mixed") {
        periodUploadTimeout();
    }
}

function stopCollector() {
    targetEvents.forEach( s => {
        window.document.removeEventListener(s, (evt) => mouseHandler(evt));
    });
    clearInterval(uploadInterval);
    clearTimeout(uploadTimeout);
}

function resetCollector(removeData = false) {
    stopCollector();
    runCollector();
}

export function run(params) {
    let res = init(params);
    if (res.status == 0) {
        runCollector();
        uploader.start(impressionId);
        console.log("Mouselog agent is activated!");
    } else {
        console.log(res.msg);
        console.log("Fail to initialize Mouselog agent.");
    }
}

export function stop() {
    uploader.stop();
    stopCollector();
    clearBuffer();
    console.log("Mouselog agent is stopped!");
}

