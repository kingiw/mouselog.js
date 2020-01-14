const uuidv1 = require('uuid/v1');

// default config
let config = {
    upload: {
        url: "/data",
        frequency: 2,
    }
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

function uploadTrace(evts) {
    const width = window.document.body.scrollWidth;
    const height = window.document.body.scrollHeight;
    const trace = {
        idx: uploadIdx,
        id: window.location.pathname, // path
        uid: uuid,
        width: width,
        height: height,
        pageLoadTime: pageLoadTime,
        label: -1,
        guess: -1,
        events: evts
    };
    
    let traceStr = JSON.stringify(trace);

    return fetch(config.upload.url, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({key: "value"}),
    }).then(res => res.json());
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
    let t = {
        timestamp: getRelativeTimestampInSeconds(),
        type: evt.type,
        x: x,
        y: y,
        button: getButton(evt.button)
    }

    if (evt.type == "wheel") {
        t.deltaX = evt.deltaX;
        t.deltaY = evt.deltaY;
    }
    eventsList.push(t);
    
    if ( eventsList.length % config.upload.frequency == 0 ) {
        uploadTrace(eventsList.slice( uploadIdx*config.upload.frequency, (uploadIdx+1)*config.upload.frequency));
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
