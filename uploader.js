let StatusEnum = {
    FAILED: -1,
    WAITING: 0,
    SUCCESS: 1,
    SENDING: 2,
}

class Uploader {
    constructor() {
        this.statusList = [];
        this.buf = [];
        this.enable = false;
    }

    start(url, options) {
        // options = {
        //     timeInterval: 3000,
        //     encoder: JSON.stringify,
        //     decoder: undefied
        // }
        this.url = url;

        // Resend all the failed data in this.buf every `timeInterval` ms
        let timeInterval = options.timeInterval ? options.timeInterval : 3000;
        this.interval = setInterval(()=>{
            this._uploadData.call(this);
        }, timeInterval);
        
        this.encoder = options.encoder ? options.encoder : JSON.stringify;
        this.decoder = options.decoder ? options.decoder : x=>x;
        this.enable = true;
    }

    stop() {
        this.enable = false;
        clearInterval(this.interval);
        // TODO?: Send all the remaining data in this.buf
    }

    upload(data) {
        if (!this.enable) return;
        this.buf.push(data);
        this.statusList.push(StatusEnum.WAITING);
        this._uploadData(data);
    }

    resendFailedData() {
        if (!this.enable) return;
        this.buf.forEach( data => {
            if (this.statusList[data.idx] == StatusEnum.FAILED) {
                this._uploadData(data);
            }
        });
    }

    _uploadData(data) {
        this.statusList[data.idx] = StatusEnum.SENDING;
        let encodedData = this.encoder(data);
        fetch(this.url, {
            method: "POST",
            credentials: "include",
            body: encodedData
        }).then(res => {
            if (res.status == 200) {
                this.statusList[data.idx] = StatusEnum.SUCCESS;
            } else {
                this.statusList[data.idx] = StatusEnum.FAILED;
                // TODO: Other processing
            }
        }).catch(err => {
            this.statusList[data.idx] = StatusEnum.FAILED;
            console.log(err);
            // TODO: Other processing
        })
    }
}

module.exports = Uploader;