let {config, updateConfig} = require('./config');

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

    start(impressionId) {
        this.impressionId = impressionId;

        this.resendInterval = setInterval(()=>{
            this.resendFailedData.call(this);
        }, config.resendInterval);
        
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
        if (config.enableGet) {
            return new Promise((resolve, reject) => {
                fetch(`${config.absoluteUrl}/api/upload-trace?websiteId=${config.websiteId}&impressionId=${this.impressionId}&data=${encodedData}`, {
                    method: "GET", 
                    credentials: "include"
                })
            });
        } else {
            return new Promise((resolve, reject) => {
                fetch(`${config.absoluteUrl}/api/upload-trace?websiteId=${config.websiteId}&impressionId=${this.impressionId}`, {
                    method: "POST",
                    credentials: "include",
                    body: encodedData
                })
            });
        }
    }
    
    _uploadData(obj) {
        obj.status = StatusEnum.SENDING;
        let encodedData = config.encoder(obj.data);
        this._getUploadPromise(encodedData)
        .then(res => {
            if (res.status == 200) {
                obj.status = StatusEnum.SUCCESS;
                if (obj.data) {
                    let params = obj.data;
                    try {
                        params.encoder = eval(params.encoder);
                    } catch(err) {
                        console.log("Invalid `config.encoder` from backend server.");
                        delete params.encoder;
                    }
                    try {
                        params.decoder = eval(params.decoder);
                    } catch(err) {
                        console.log("Invalid `config.decoder` from backend server.");
                        delete params.decoder;
                    }  
                    updateConfig(obj.data);
                }
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