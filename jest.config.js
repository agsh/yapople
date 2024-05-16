module.exports = {
    collectCoverageFrom: [
        'lib/yapople.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['json', 'json-summary', 'text', 'lcov'],
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.test.js'
    ],
};
