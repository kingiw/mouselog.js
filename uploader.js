let {config, updateConfig} = require('./config');

let StatusEnum = {
    WAITING: 0,
    SENDING: 1,
    SUCCESS: 2,
}

class Uploader {
    constructor() {
        this.resendQueue = [];
    }

    start(impressionId) {
        this.impressionId = impressionId;
        this.resendInterval = setInterval(()=>{
            this._resendFailedData.call(this);
        }, config.resendInterval);
    }

    stop() {
        clearInterval(this.resendInterval);
        // TODO?: Send all the remaining data in this.buf
    }

    upload(data) {
        // resolve(true/false): uploaded success/fail.
        // reject(ErrorMessage): Errors occur when updating the config.
        return new Promise( (resolve, reject) => {
            let encodedData = config.encoder(data);
            this._upload(encodedData).then(res => {
                if (res.status == 200) {
                    res.json().then( resObj => {
                        if (resObj.status !== "ok") {
                            throw new Error("Response object status is not ok.");
                        }
                        if (resObj.msg == "config") {
                           if (!updateConfig(resObj.data)) {
                               resolve({status: -1, msg: `Data is uploaded, but errors occur when updating config.`});
                           };
                        }
                        resolve({status: 0});
                    });
                } else {
                    throw new Error("Response status code is not 200.");
                }
            }).catch(err => {
                _appendFailedData(data);
                resolve({status: -1, msg: `Fail to upload a bunch of data: ${err.message}`});
            })
        });
    }

    setImpressionId(impId) {
        this.impressionId = impId;
    }

    _resendFailedData() {
        let i = 0;
        while (i < this.resendQueue.length) {
            if (obj.status == StatusEnum.SUCCESS) {
                this.resendQueue.splice(i, 1);  // Remove it from resendQueue
            } else {
                i += 1;
                if (obj.status == StatusEnum.WAITING) {
                    obj.status = StatusEnum.SENDING;
                    this.upload(obj.data).then( result => {
                        if (result) { // Successfully resend the data
                            obj.status = StatusEnum.SUCCESS;
                        } else {
                            obj.status = StatusEnum.WAITING;
                        }
                    });
                }
            }
        }
    }

    _upload(encodedData) {
        if (config.enableGet) {
            return fetch(`${config.absoluteUrl}/api/upload-trace?websiteId=${config.websiteId}&impressionId=${this.impressionId}&data=${encodedData}`, {
                method: "GET", 
                credentials: "include"
            });
        } else {
            return fetch(`${config.absoluteUrl}/api/upload-trace?websiteId=${config.websiteId}&impressionId=${this.impressionId}`, {
                method: "POST",
                credentials: "include",
                body: encodedData
            });
        }
    }

    _appendFailedData(data) {
        this.resendQueue.push({
            status: StatusEnum.WAITING,
            data: data
        });
    }
    
}

module.exports = Uploader;