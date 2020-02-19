module.exports = {
    env: {
        browser: true,
        es6: true
    },
    extends: "eslint:recommended", 
    globals: {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    parserOptions: {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    rules: { 
        'indent': [0, 4],
        'semi': [1, 'always'],
    }
};