import urljoin from 'url-join';
import * as debug from './debugger';
import { getGlobalUserId }   from './utils';

let StatusEnum = {
    WAITING: 0,
    SENDING: 1,
    SUCCESS: 2,
};

class Uploader {
    constructor(impId, sessId, config) {
        this.impressionId = impId;
        this.sessionId = sessId;
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

    upload(data, encodedData, queryConfig = false) {
        // resolve({status:-1/0/1, ...}): uploading success/fail.
        // reject(ErrorMessage): Errors occur when updating the config.
        return new Promise( (resolve) => {
            debug.write(`Uploading Pkg ${data.packetId}, window size: ${data.width}*${data.height}, events count: ${data.events.length}`);
            for (let i = 0; i < 3 && i < data.events.length; ++i)
                debug.write(`    ${JSON.stringify(data.events[i])}`);
            let url = urljoin(
                this.config.absoluteUrl,
                `?websiteId=${this.config.websiteId}&sessionId=${this.sessionId}&impressionId=${this.impressionId}&userId=${getGlobalUserId()}${queryConfig ? "&queryConfig=1" : ""}`
            );
            this._upload(encodedData, url).then(res => {
                if (res.status == 200) {
                    return res.json();
                } else {
                    throw new Error("Response status code is not 200.");
                }
            }).then(resObj => {
                debug.write(`Pkg ${data.packetId} response=${JSON.stringify(resObj)}`);
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
                debug.write(`Pkg ${data.packetId} failed, wait for resending. Error message: ${err.message}`);
                this._appendFailedData(data, encodedData);
                resolve({
                    status: -1, 
                    msg: `Fail to upload data bunch #${data.packetId}, ${err.message}`
                });
            });
        });
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
                debug.write(`Resending Pkg ${obj.data.packetId}`);
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

    _upload(encodedData, url) {
        // https://github.com/w3c/beacon/pull/27
        // Set keepalive: true for guarantee the request will be sent when the page is unloaded.
        if (this.config.enableGet) {
            return fetch(`${url}&data=${encodedData}`, {
                method: "GET", 
                keepalive: true
            });
        } else {
            return fetch(url, {
                method: "POST",
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
