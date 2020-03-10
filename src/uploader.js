import urljoin from 'url-join';
import * as debug from './debugger';
import { getGlobalUserId }   from './utils';

let StatusEnum = {
    WAITING: 0,
    SENDING: 1,
    SUCCESS: 2,
};

class Uploader {
    constructor(config) {
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

    upload(data, encodedData) {
        // resolve({status:-1/0/1, ...}): uploading success/fail.
        // reject(ErrorMessage): Errors occur when updating the config.
        return new Promise( (resolve) => {
            debug.write(`Uploading Pkg ${data.idx}, window size: ${data.width}*${data.height}, events count: ${data.events.length}`);
            for (let i = 0; i < 3 && i < data.events.length; ++i)
                debug.write(`    ${JSON.stringify(data.events[i])}`);
            this._upload(encodedData).then(res => {
                if (res.status == 200) {
                    return res.json();
                } else {
                    throw new Error("Response status code is not 200.");
                }
            }).then(resObj => {
                debug.write(`Pkg ${data.idx} response=${JSON.stringify(resObj)}`);
                if (resObj.status !== "ok") {
                    throw new Error("Response object status is not ok.");
                }
                if (resObj.msg == "config") {
                    resolve({
                        status: 1, 
                        msg: `Get config from server`, 
                        config: resObj.data
                    });
                }
                resolve({status: 0});
            }).catch(err => {
                debug.write(`Pkg ${data.idx} failed, wait for resending. Error message: ${err.message}`);
                this._appendFailedData(data, encodedData);
                resolve({
                    status: -1, 
                    msg: `Fail to upload data bunch #${data.idx}, ${err.message}`
                });
            });
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
        if (this.resendQueue.length > 0) {
            debug.write("Resending data...");
        }
        while (i < this.resendQueue.length) {
            let obj = this.resendQueue[i];
            if (obj.status == StatusEnum.SUCCESS) {
                this.resendQueue.splice(i, 1);  // Remove it from resendQueue
            } else {
                i += 1;
                debug.write(`Resending Pkg ${obj.data.idx}`);
                if (obj.status == StatusEnum.WAITING) {
                    obj.status = StatusEnum.SENDING;
                    this.upload(obj.data, obj.encodedData).then( result => {
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
            `?websiteId=${this.config.websiteId}&impressionId=${this.impressionId}&userId=${getGlobalUserId()}`
        );
        // https://github.com/w3c/beacon/pull/27
        // Set keepalive: true for guarantee the request will be sent when the page is unloaded.
        if (this.config.enableGet) {
            return fetch(`${url}&data=${encodedData}`, {
                method: "GET", 
                credentials: "include",
                keepalive: true
            });
        } else {
            return fetch(url, {
                method: "POST",
                credentials: "include",
                body: encodedData,
                keepalive: true
            });
        }
    }

    _appendFailedData(data, encodedData) {
        this.resendQueue.push({
            status: StatusEnum.WAITING,
            data: data,
            encodedData: encodedData
        });
    }
    
}

export default Uploader;
