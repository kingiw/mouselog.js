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

function uploadTrace() {
    let trace = newTrace();
    trace.events = eventsList;
    eventsList = [];
    return uploader.upload(trace); // This is a promise
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
    return new Promise((resolve) => {
        clearBuffer();
        pageLoadTime = new Date();
        uploadIdx = 0;
        uploader = new Uploader();
        impressionId = uuidv4();
        uploader.setImpressionId(impressionId);
        if (buildConfig(params)) {
            // Upload an empty data to fetch config from backend
            uploadTrace().then( result => {
                if (result.status === 0) { // Success
                    // clean up the buffer before unloading the window
                    onbeforeunload = (evt) => {
                        if (eventsList.length != 0) {
                            uploadTrace();
                        }
                    }
                    resolve({status: 0});
                } else {    // Fail
                    console.log(result.msg);
                    resolve({status: -1, msg: `Fail to initialize config.`});
                }
            });
        } else {
            resolve({status: -1, msg: `Fail to initialize config.`});
        }
    })
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

export function run(params) {
    init(params).then( res => {
        if (res.status === 0) {
            runCollector();
            uploader.start(impressionId);
            console.log("Mouselog agent is activated!");
        } else {
            console.log(res.msg);
            console.log("Fail to initialize Mouselog agent.");
        }
    })
}

export function stop() {
    uploader.stop();
    stopCollector();
    clearBuffer();
    console.log("Mouselog agent is stopped!");
}

