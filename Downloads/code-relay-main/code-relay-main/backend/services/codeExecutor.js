const axios = require('axios');

// Using Piston API - configurable via environment variable
// Defaults to self-hosted, falls back to public API
const PISTON_API = process.env.PISTON_API_URL || 'http://localhost:2000/api/v2/piston';

const languageMap = {
    'C': 'c',
    'C++': 'c++',
    'Python': 'python',
    'Java': 'java'
};

// Runtime cache to reduce API calls
let runtimeCache = {
    data: null,
    timestamp: null,
    ttl: 60 * 60 * 1000 // 1 hour in milliseconds
};

/**
 * Get available Piston runtimes with caching
 */
async function getCachedRuntimes() {
    const now = Date.now();

    // Return cached data if still valid
    if (runtimeCache.data && runtimeCache.timestamp && (now - runtimeCache.timestamp < runtimeCache.ttl)) {
        console.log('Using cached Piston runtimes');
        return runtimeCache.data;
    }

    // Fetch fresh data
    console.log('Fetching fresh Piston runtimes from:', PISTON_API);
    const response = await axios.get(`${PISTON_API}/runtimes`);

    // Update cache
    runtimeCache.data = response.data;
    runtimeCache.timestamp = now;

    return response.data;
}

const runTestcases = async (code, language, testcases, timeLimit, memoryLimit) => {
    const results = [];

    for (const testcase of testcases) {
        try {
            const result = await executeCode(code, language, testcase.input, timeLimit);

            const actualOutput = result.output.trim();
            const expectedOutput = testcase.expectedOutput.trim();
            const passed = actualOutput === expectedOutput;

            results.push({
                testcaseId: testcase.id,
                passed,
                input: testcase.input,
                expectedOutput: testcase.expectedOutput,
                actualOutput: result.output,
                error: result.error,
                executionTime: result.executionTime
            });
        } catch (error) {
            results.push({
                testcaseId: testcase.id,
                passed: false,
                input: testcase.input,
                expectedOutput: testcase.expectedOutput,
                actualOutput: '',
                error: error.message,
                executionTime: 0
            });
        }
    }

    return results;
};

const executeCode = async (code, language, input, timeLimit) => {
    const startTime = Date.now();

    try {
        const pistonLanguage = languageMap[language] || language.toLowerCase();

        // Get available runtimes (cached)
        const runtimes = await getCachedRuntimes();
        const runtime = runtimes.find(r => r.language === pistonLanguage);

        if (!runtime) {
            const availableLanguages = runtimes.map(r => r.language).join(', ');
            console.error(`Language "${pistonLanguage}" not found. Available languages:`, availableLanguages);
            throw new Error(`Language ${language} not supported. Tried: ${pistonLanguage}`);
        }

        // Convert timeLimit from seconds to milliseconds
        const runTimeoutMs = (timeLimit || 5) * 1000;

        console.log(`Executing code with Piston API:`, {
            language: pistonLanguage,
            version: runtime.version,
            runTimeout: runTimeoutMs,
            inputLength: input?.length || 0
        });

        // Execute code
        const response = await axios.post(`${PISTON_API}/execute`, {
            language: pistonLanguage,
            version: runtime.version,
            files: [{
                content: code
            }],
            stdin: input || '',
            compile_timeout: 10000,
            run_timeout: runTimeoutMs
        });

        const executionTime = Date.now() - startTime;

        // Log Piston response for debugging
        console.log('Piston API response:', {
            compileCode: response.data.compile?.code,
            runCode: response.data.run?.code,
            runSignal: response.data.run?.signal,
            stdout: response.data.run?.stdout?.substring(0, 100),
            stderr: response.data.run?.stderr?.substring(0, 100)
        });

        if (response.data.compile && response.data.compile.code !== 0) {
            return {
                output: '',
                error: response.data.compile.stderr || response.data.compile.output || 'Compilation error',
                executionTime
            };
        }

        if (response.data.run.code !== 0 && response.data.run.signal) {
            return {
                output: response.data.run.stdout || '',
                error: response.data.run.stderr || `Runtime error (signal: ${response.data.run.signal})`,
                executionTime
            };
        }

        return {
            output: response.data.run.stdout || '',
            error: response.data.run.stderr || null,
            executionTime
        };

    } catch (error) {
        const executionTime = Date.now() - startTime;

        if (error.response) {
            return {
                output: '',
                error: `API Error: ${error.response.data.message || error.message}`,
                executionTime
            };
        }

        return {
            output: '',
            error: error.message,
            executionTime
        };
    }
};

module.exports = {
    runTestcases,
    executeCode
};
