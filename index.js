const uuidv4 = require('uuid/v4');
const Uploader = require('./uploader');

// default config
let config = {
    // Upload the website interaction data object when every `frequency` events are captured.
    frequency: 50,
    // The website interaction data object will be encoded by `encoder` before uploading to the server.
    encoder: JSON.stringify,
    // The response data will be decoded by `decoder` 
    decoder: x => x, 
    // Use GET method to upload data? (stringified data will be embedded in URI)
    enableGET: false, 
    // Time interval for resending the failed trace data
    resendInterval: 3000
};

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

let uploader = new Uploader();
let impressionId;
let serverUrl;
let websiteId;
let eventsList;
let pageLoadTime;
let uploadIdx;

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

function getByteCount(s) {
    let count = 0, stringLength = s.length, i;
    s = String(s || "");
    for (i = 0; i < stringLength; i++) {
      const partCount = encodeURI(s[i]).split("%").length;
      count += partCount === 1 ? 1 : partCount - 1;
    }
    return count;
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
    
    if ( eventsList.length % config.frequency == 0 ) {
        uploadTrace();
    }
}

export function refresh() {
    eventsList = [];
    pageLoadTime = new Date();
    uploadIdx = 0;
    uploader.start(
        serverUrl,
        websiteId,
        impressionId,
        config
    );
}

export function run(_serverUrl, _websiteId, options) {
    if (options) {
        config = options;
    }
    
    serverUrl = _serverUrl;
    websiteId = _websiteId;
    impressionId = uuidv4();
    refresh();
    
    targetEvents.forEach( s => {
        window.document.addEventListener(s, (evt) => mouseHandler(evt));
    });

    // Send an empty trace data when mouselog is activated
    uploadTrace(true);
}

export function stop() {
    targetEvents.forEach( s => {
        window.document.removeEventListener(s, (evt) => mouseHandler(evt));
    });
    uploader.stop();
}
