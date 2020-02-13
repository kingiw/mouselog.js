let {config, updateConfig} = require('./config');

let StatusEnum = {
    WAITING: 0,
    SENDING: 1,
    SUCCESS: 2,
}

class Uploader {
    constructor(impressionId, config) {
        this.impressionId = impressionId;
        this.config = config;
        this.resendQueue = [];
    }

    start() {
        this.resendInterval = setInterval(()=>{
            this._resendFailedData.call(this);
        }, this.config.resendInterval);
    }

    stop() {
        clearInterval(this.resendInterval);
        // TODO?: Send all the remaining data in this.buf
    }

    upload(data) {
        // resolve(true/false): uploaded success/fail.
        // reject(ErrorMessage): Errors occur when updating the config.
        return new Promise( (resolve, reject) => {
            let encodedData = JSON.stringify(data);
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
                this._appendFailedData(data);
                resolve({status: -1, msg: `Fail to upload a bunch of data: ${err.message}`});
            })
        });
    }

    setImpressionId(impId) {
        this.impressionId = impId;
    }

    setConfig(config) {
        this.config = config;
    }

    _resendFailedData() {
        let i = 0;
        let obj = this.resendQueue[i];
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
        if (this.config.enableGet) {
            return fetch(`${this.config.absoluteUrl}/api/upload-trace?websiteId=${this.config.websiteId}&impressionId=${this.impressionId}&data=${encodedData}`, {
                method: "GET", 
                credentials: "include"
            });
        } else {
            return fetch(`${this.config.absoluteUrl}/api/upload-trace?websiteId=${this.config.websiteId}&impressionId=${this.impressionId}`, {
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