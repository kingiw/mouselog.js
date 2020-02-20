module.exports = {
    env: {
        "browser": true,
        // "commonjs": true,
        "es6": true,
    },
    extends: "eslint:recommended",
    parserOptions: {
        "sourceType": "module"
    },
    rules: { 
        'indent': [0, 4],
        'semi': ['warn', 'always'],
    }
};
