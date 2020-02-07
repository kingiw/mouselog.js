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
        this.serverUrl = serverUrl;
        this.websiteId = websiteId;
        this.impressionId = impressionId;

        // Resend all the failed data in this.buf every `resendInterval` ms
        let resendInterval = options.resendInterval ? options.resendInterval : 3000;
        this.resendInterval = setInterval(()=>{
            this.resendFailedData.call(this);
        }, resendInterval);
        
        this.enableGET = options.enableGET ? options.enableGET : false;
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

    _getUploadPromise(encodedData) {
        if (this.enableGET) {
            return new Promise((resolve, reject) => {
                fetch(`${this.serverUrl}/api/upload-trace?websiteId=${this.websiteId}&impressionId=${this.impressionId}&data=${encodedData}`, {
                    method: "GET", 
                    credentials: "include"
                })
            });
        } else {
            return new Promise((resolve, reject) => {
                fetch(`${this.serverUrl}/api/upload-trace?websiteId=${this.websiteId}&impressionId=${this.impressionId}`, {
                    method: "POST",
                    credentials: "include",
                    body: encodedData
                })
            });
        }
    }
    
    _uploadData(obj) {
        obj.status = StatusEnum.SENDING;
        let encodedData = this.encoder(obj.data);
        this._getUploadPromise(encodedData)
        .then(res => {
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