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
let serverUrl;
let websiteId;
let eventsList;
let pageLoadTime;
let uploadIdx;
let uploadInterval;

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

function uploadTrace(init=false) {
    let trace = newTrace();
    if (!init) {
        trace.events = eventsList;
        eventsList = [];
    }
    uploader.upload(trace);
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

    if (buildConfig(params)) {
        // Fetch config when mouselog is activated
        // The backend server may return a new config and overwrite the agent's config
        uploadTrace(true);
    
        // clean up the buffer before unloading the window
        onbeforeunload = (evt) => {
            if (eventsList.length != 0) {
                uploadTrace();
            }
        }
        return true;
    } else {
        return false;
    }

}

function runCollector() {
    targetEvents.forEach( s => {
        window.document.addEventListener(s, (evt) => mouseHandler(evt));
    });

    if (config.uploadMode === "periodic") {
        uploadInterval = setInterval(() => {
            if (eventsList.length != 0) {
                uploadTrace();
            }
        }, config.uploadPeriod);
    }
}

function stopCollector() {
    targetEvents.forEach( s => {
        window.document.removeEventListener(s, (evt) => mouseHandler(evt));
    });
    clearInterval(uploadInterval);
}

function onConfigChange() {
    stopCollector();
    uploader.stop();
    uploader.start(impressionId);
    runCollector();
}
window.addEventListener("configChange", onConfigChange);

export function run(params) {
    if (init(params)) {
        runCollector();
        uploader.start(impressionId);
    }
}

export function stop() {
    uploader.stop();
    stopCollector();
    clearBuffer();
}

