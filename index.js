const uuidv4 = require('uuid/v4');
const Uploader = require('./uploader');
let { Config } = require('./config');

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
let pageLoadTime = new Date();


class Mouselog{
    constructor() {
        this.config = new Config();
        this.impressionId = uuidv4();
        this.mouselogLoadTime = new Date();
        this.uploader = new Uploader();
        this.eventsList = [];
        this.uploadInterval; // For "periodic" upload mode
        this.uploadTimeout; // For "mixed" upload mode
    }

    _clearBuffer() {
        this.eventsList = [];
    }

    _newTrace() {
        let trace = {
            id: '0',
            idx: this.uploadIdx,
            url: window.location.hostname ? window.location.hostname : "localhost",
            path: window.location.pathname,
            width: document.body.scrollWidth,
            height: document.body.scrollHeight,
            pageLoadTime: pageLoadTime,
            label: -1,
            guess: -1,
            events: []
        }
        this.uploadIdx += 1;
        return trace;
    }

    _mouseHandler(evt) {
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
            // TODO: Is `id` be used to order the event by timestamp?
            id: this.eventsList.length, 
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
        this.eventsList.push(tmpEvt);

        if ( this.config.uploadMode == "event-triggered" && this.eventsList.length % this.config.frequency == 0 ) {
            this._uploadTrace();
        }

        if ( this.config.uploadMode == "mixed" && this.eventsList.length % this.config.frequency == 0) {
            this._periodUploadTimeout();
            this._uploadTrace();
        }
    }

    _uploadTrace() {
        let trace = this._newTrace();
        trace.events = this.eventsList;
        this.eventsList = [];
        return this.uploader.upload(trace); // This is a promise
    }

    _periodUploadTimeout() {
        clearTimeout(this.uploadTimeout);
        this.uploadTimeout = setTimeout(() => {
            if (this.eventsList.length > 0) {
                this._uploadTrace();
            }
        })
    }

    _periodUploadInterval() {
        clearInterval(this.uploadInterval);
        this.uploadInterval = setInterval(() => {
            if (this.eventsList.length > 0) {
                this._uploadTrace();
            }
        }, this.config.uploadPeriod);
    }

    _runCollector() {
        targetEvents.forEach( s => {
            window.document.addEventListener(s, (evt) => this._mouseHandler(evt));
        });

        if (this.config.uploadMode === "periodic") {
            this._periodUploadInterval();
        }

        if (this.config.uploadMode === "mixed") {
            this._periodUploadTimeout();
        }
    }

    _stopCollector() {
        targetEvents.forEach( s => {
            window.document.removeEventListener(s, (evt) => this._mouseHandler(evt));
        });
        clearInterval(this.uploadInterval);
        clearTimeout(this.uploadTimeout);
    }

    _resetCollector() {
        this._stopCollector();
        this._runCollector();
    }

    _init(config) {
        this.impressionId = uuidv4();
        this._clearBuffer();
        this.uploadIdx = 0;
        this.uploader = new Uploader(this.impressionId, this.config);
        this.uploader.setImpressionId(this.impressionId);
        if (this.config.build(config)) {
             // Async: Upload an empty data to ofetch config from backend
            this._uploadTrace().then( result => {
                if (result.status === 0) { // Config is updated successfully
                    this._resetCollector();
                } else {
                    console.log(result.msg);
                    console.log("Fail to overwrite config with server config.")
                }
            });
            window.onbeforeunload = (evt) => {
                if (this.eventsList.length != 0) {
                    this._uploadTrace();
                }
            }
            return {status: 0, msg: `Invalid configuration.`};
        } else {
            return {status: -1, msg: `Invalid configuration.`};
        }
    }

    run(config) {
        let res = this._init(config);
        if (res.status == 0) {
            this._runCollector();
            this.uploader.start(this.impressionId);
            console.log("Mouselog agent is activated!");
        } else {
            console.log(res.msg);
            console.log("Fail to initialize Mouselog agent.");
        }
    }

    stop() {
        this.uploader.stop();
        this._stopCollector();
        this._clearBuffer();
        console.log(`Mouselog agent ${this.impressionId} is stopped!`);
    }
}

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

module.exports = {Mouselog};