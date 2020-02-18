let urljoin = require('url-join');
let {config, updateConfig} = require('./config');
const debug = require('./debugger');

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
        // resolve({status:-1/0/1, ...}): uploading success/fail.
        // reject(ErrorMessage): Errors occur when updating the config.
        return new Promise( (resolve, reject) => {
            let encodedData = JSON.stringify(data);
            debug.write(`Uploading Pkg ${data.idx}, window size: ${data.width}*${data.height}, events count: ${data.events.length}`)
            this._upload(encodedData).then(res => {
                if (res.status == 200) {
                    res.json().then( resObj => {
                        if (resObj.status !== "ok") {
                            throw new Error("Response object status is not ok.");
                        }
                        if (resObj.msg == "config") {
                            debug.write(`Pkg ${data.idx} success.`)
                            resolve({
                                status: 1, 
                                msg: `Get config from server`, 
                                config: resObj.data
                            });
                        }
                        resolve({status: 0});
                    });
                } else {
                    throw new Error("Response status code is not 200.");
                }
            }).catch(err => {
                debug.write(`Pkg ${data.idx} failed, wait for resending. Error message: ${err.message}`);
                this._appendFailedData(data);
                resolve({
                    status: -1, 
                    msg: `Fail to upload data bunch #${data.idx}, ${err.message}`
                });
            })
        });
    }

    setImpressionId(impId) {
        this.impressionId = impId;
    }

    setConfig(config) {
        this.stop();
        this.config = config;
        this.start();
    }

    _resendFailedData() {
        let i = 0;
        debug.write("Resending data...");
        while (i < this.resendQueue.length) {
            let obj = this.resendQueue[i];
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
        let url = urljoin(
            this.config.absoluteUrl, 
            '/api/upload-trace', 
            `?websiteId=${this.config.websiteId}&impressionId=${this.impressionId}`, 
        );
        if (this.config.enableGet) {
            return fetch(`${url}&data=${encodedData}`, {
                method: "GET", 
                credentials: "include"
            });
        } else {
            return fetch(url, {
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