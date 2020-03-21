export function maxNumber(...nums) {
    let res = nums[0];
    for (let i = 1; i < nums.length; ++i) {
        res = res > nums[i] ? res : nums[i];
    }
    return res;
}

export function parseInt(x) {
    let res = typeof(x) === 'number' ? x : Number(x);
    return Math.round(res);
}

// https://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
export function byteLength(str) {
    // returns the byte length of an utf8 string
    var s = str.length;
    for (var i=str.length-1; i>=0; i--) {
      var code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) s++;
      else if (code > 0x7ff && code <= 0xffff) s+=2;
      if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
}

export function getGlobalUserId() {
    return window.mouselogUserId ? window.mouselogUserId : "";
}

export function equalArray(array1, array2) {
    if (!array1  || !array2 || array1.length != array2.length) {
        return false
    }
    for (let i = 0; i < array1.length; ++i) {
        if (array1[i] != array2[i]) {
            return false;
        } 
    }
    return true;
}