let StatusEnum = {
    FAILED: -1,
    WAITING: 0,
    SUCCESS: 1,
    SENDING: 2,
}

class Uploader {
    constructor() {
        this.buf = [];
        this.enable = false;
    }

    start(serverUrl, websiteId, impressionId, options) {
        // options = {
        //     timeInterval: 3000,
        //     encoder: JSON.stringify,
        //     decoder: undefied
        // }
        this.serverUrl = serverUrl;
        this.websiteId = websiteId;
        this.impressionId = impressionId;

        // Resend all the failed data in this.buf every `timeInterval` ms
        let timeInterval = options.timeInterval ? options.timeInterval : 3000;
        this.resendInterval = setInterval(()=>{
            this.resendFailedData.call(this);
        }, timeInterval);
        
        this.encoder = options.encoder ? options.encoder : JSON.stringify;
        this.decoder = options.decoder ? options.decoder : x=>x;
        this.enable = true;
    }

    stop() {
        this.enable = false;
        clearInterval(this.resendInterval);
        // TODO?: Send all the remaining data in this.buf
    }

    upload(data) {
        if (!this.enable) return;
        this.buf.push({
            status: StatusEnum.WAITING,
            data: data
        });
        this._uploadData(this.buf[this.buf.length - 1]);
    }

    resendFailedData() {
        if (!this.enable) return;
        this.buf.forEach( obj => {
            if (obj.status == StatusEnum.FAILED) {
                this._uploadData(obj);
            }
        })
    }

    _uploadData(obj) {
        obj.status = StatusEnum.SENDING;
        let encodedData = this.encoder(obj.data);
        console.log(`Here: ${this.serverUrl}`);
        fetch(`${this.serverUrl}/api/upload-trace?websiteId=${this.websiteId}&impressionId=${this.impressionId}`, {
            method: "POST",
            credentials: "include",
            body: encodedData
        }).then(res => {
            if (res.status == 200) {
                obj.status = StatusEnum.SUCCESS;
            } else {
                obj.status = StatusEnum.FAILED;
                // TODO: Other processing
            }
        }).catch(err => {
            obj.status = StatusEnum.FAILED;
            console.log(err);
            // TODO: Other processing
        })
    }
}

module.exports = Uploader;