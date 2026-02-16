const axios = require('axios');

// Test self-hosted Piston API
const PISTON_API = process.env.PISTON_API_URL || 'http://localhost:2000/api/v2/piston';

const testCases = [
    {
        name: 'Python Hello World',
        language: 'python',
        code: 'print("Hello from Python!")',
        expectedOutput: 'Hello from Python!'
    },
    {
        name: 'C Hello World',
        language: 'c',
        code: '#include <stdio.h>\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}',
        expectedOutput: 'Hello from C!'
    },
    {
        name: 'C++ Hello World',
        language: 'c++',
        code: '#include <iostream>\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    return 0;\n}',
        expectedOutput: 'Hello from C++!'
    },
    {
        name: 'Java Hello World',
        language: 'java',
        code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}',
        expectedOutput: 'Hello from Java!'
    }
];

async function testPiston() {
    console.log('🚀 Testing Piston API:', PISTON_API);
    console.log('='.repeat(60));

    try {
        // First, get available runtimes
        console.log('\n📋 Fetching available runtimes...');
        const runtimesResponse = await axios.get(`${PISTON_API}/runtimes`);
        console.log(`✅ Found ${runtimesResponse.data.length} language runtimes\n`);

        // Test each language
        let passed = 0;
        let failed = 0;

        for (const test of testCases) {
            console.log(`\n🧪 Testing: ${test.name}`);
            console.log('-'.repeat(60));

            try {
                // Find runtime for this language
                const runtime = runtimesResponse.data.find(r => r.language === test.language);

                if (!runtime) {
                    console.log(`❌ FAILED: Runtime for ${test.language} not found`);
                    failed++;
                    continue;
                }

                console.log(`   Language: ${runtime.language}`);
                console.log(`   Version: ${runtime.version}`);

                // Execute code
                const startTime = Date.now();
                const response = await axios.post(`${PISTON_API}/execute`, {
                    language: runtime.language,
                    version: runtime.version,
                    files: [{ content: test.code }]
                });
                const executionTime = Date.now() - startTime;

                const output = response.data.run.stdout?.trim() || '';
                const stderr = response.data.run.stderr?.trim() || '';
                const exitCode = response.data.run.code || 0;

                console.log(`   Execution Time: ${executionTime}ms`);
                console.log(`   Exit Code: ${exitCode}`);
                console.log(`   Output: "${output}"`);

                if (stderr) {
                    console.log(`   Stderr: "${stderr}"`);
                }

                // Check if output matches expected
                if (output === test.expectedOutput && exitCode === 0) {
                    console.log(`   ✅ PASSED`);
                    passed++;
                } else {
                    console.log(`   ❌ FAILED`);
                    console.log(`   Expected: "${test.expectedOutput}"`);
                    console.log(`   Got: "${output}"`);
                    failed++;
                }

            } catch (error) {
                console.log(`   ❌ FAILED: ${error.message}`);
                failed++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${testCases.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

        if (failed === 0) {
            console.log('\n🎉 All tests passed! Piston is working correctly.');
            process.exit(0);
        } else {
            console.log('\n⚠️  Some tests failed. Please check the output above.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ ERROR: Failed to connect to Piston API');
        console.error('Message:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 TROUBLESHOOTING:');
            console.error('   1. Make sure Docker is running');
            console.error('   2. Start Piston: docker-compose up -d piston');
            console.error('   3. Check status: docker-compose ps');
            console.error('   4. View logs: docker-compose logs piston');
        }

        process.exit(1);
    }
}

// Run tests
testPiston();
