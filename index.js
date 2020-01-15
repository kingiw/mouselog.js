const uuidv1 = require('uuid/v1');

// default config
let config = {
    upload: {
        url: "/data",
        // Upload data once capture `frequency` events.
        frequency: 50,
        // If config.upload.encoder is defined, data object will be encoded by `encoder` before uploading.
        encoder: JSON.stringify, 
        // If config.upload.decoder is defined, data will be decoded by `decoder` after receiving the response from the server
        decoder: undefined
    },
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

let uuid;
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
    return {
        id: uuid,
        url: window.location.hostname ? window.location.hostname : "localhost",
        path: window.location.pathname,
        width: document.body.scrollWidth,
        height: document.body.scrollHeight,
        pageLoadTime: pageLoadTime,
        label: -1,
        guess: -1,
        events: []
    }
}

function uploadTrace(evts) {
    let trace = newTrace();
    let start = uploadIdx * config.upload.frequency;
    let end = (uploadIdx + 1) * config.upload.frequency;
    trace.events = eventsList.slice(start, end)
    let buffer;

    if (config.upload.encoder) {
        buffer = config.upload.encoder(trace);
    } else {
        buffer = trace;
    }

    return fetch(config.upload.url, {
        method: 'POST',
        credentials: 'include',
        body: buffer,
    }).then(res => {
        if (config.upload.decoder)
            res = config.upload.decoder(res);
        //TODO
    });
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
    
    if ( eventsList.length % config.upload.frequency == 0 ) {
        uploadTrace();
        uploadIdx += 1;
    }
}

export function refresh() {
    eventsList = [];
    pageLoadTime = new Date();
    uploadIdx = 0;
}

export function run(_config) {
    if (_config) {
        config = _config;
    }
    uuid = uuidv1();
    refresh();
    
    targetEvents.forEach( s => {
        window.document.addEventListener(s, (evt) => mouseHandler(evt));
    })
}

export function stop() {
    targetEvents.forEach( s => {
        window.document.removeEventListener(s, (evt) => mouseHandler(evt));
    })
}
