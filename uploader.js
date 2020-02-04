let StatusEnum = {
    FAILED: -1,
    WAITING: 0,
    SUCCESS: 1,
    SENDING: 2,
}

class Uploader {
    constructor() {
        this.status = [];
        this.buf = [];
    }

    start(url, options) {
        // options = {
        //     timeInterval: 1000,
        //     encoder: JSON.stringify,
        //     decoder: undefied
        // }
        this.url = url;

        // Send and resend all the data in this.buf every `timeInterval` ms
        let timeInterval = options.timeInterval ? options.timeInterval : 1000;
        this.interval = setInterval(()=>{
            this._uploadData.call(this);
        }, timeInterval);
        
        this.encoder = options.encoder ? options.encoder : x=>x;
        console.log("HERE:", options.encoder);
        this.decoder = options.decoder ? options.decoder : x=>x;
    }

    stop() {
        clearInterval(this.interval);
        // TODO: Send all the remaining data in this.buf
    }

    upload(data) {
        this.buf.push(data);
        this.status.push(StatusEnum.WAITING);
    }

    _uploadData() {
        this.buf.forEach( data => {
            if (this.status[data.idx] == StatusEnum.WAITING 
                || this.status[data.idx] == StatusEnum.FAILED) {
                console.log("Uploading a Datum");
                this.status[data.idx] = StatusEnum.SENDING;
                let encodedData = this.encoder(data);
                fetch(this.url, {
                    method: "POST",
                    credentials: "include",
                    body: encodedData
                }).then(res => {
                    if (res.status == 200) {
                        this.status[data.idx] = StatusEnum.SUCCESS;
                        // TODO: Other process
                    } else {
                        this.status[data.idx] = StatusEnum.FAILED;
                    }
                }).catch(err => {
                    this.status[data.idx] = StatusEnum.FAILED;
                    console.log(err);
                    // TODO: Other process
                })
            }
        });
    }   
}

module.exports = Uploader;