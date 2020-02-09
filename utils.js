let JSONfn = require('json-fn');
let stringHash = require('string-hash');

function sortObjectByKey(unordered){
    let ordered = {};
    Object.keys(unordered).sort().forEach(key => {
        ordered[key] = unordered[key];
    });
    return ordered;
}

function getObjectHash(obj) {
    let ordered = sortObjectByKey(obj);
    let s = JSONfn.stringify(ordered);
    return stringHash(s);
}

module.exports = {
    sortObjectByKey,
    getObjectHash
}