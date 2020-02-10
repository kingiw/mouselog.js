let mouselog = require('../index');

function run(config) {
    mouselog.run(config);
}

function stop() {
    mouselog.stop();
}

module.exports = { run, stop };