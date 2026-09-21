import newman from 'newman';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionPath = path.resolve(__dirname, '../buildops_postman_collection.json');
const environmentPath = path.resolve(__dirname, '../buildops_postman_environment.json');

console.log('================================================================');
console.log('🚀 [BuildOps AI] Launching Automated Postman Collection Test Suite');
console.log(`📁 Collection : ${collectionPath}`);
console.log(`🌐 Environment: ${environmentPath}`);
console.log('================================================================\n');

newman.run(
  {
    collection: collectionPath,
    environment: environmentPath,
    reporters: ['cli'],
    reporter: {
      cli: {
        noBanner: true,
        noSummary: false,
        noFailures: false,
      },
    },
    bail: false,
  },
  function (err, summary) {
    if (err) {
      console.error('❌ [Postman Runner Error]:', err);
      process.exit(1);
    }

    const { stats, failures } = summary.run;

    console.log('\n================================================================');
    console.log('📊 POSTMAN TEST RUN SUMMARY FOR BUILDOPS AI');
    console.log('================================================================');
    console.log(`Total Requests Executed  : ${stats.requests.total}`);
    console.log(`Successful Requests      : ${stats.requests.total - stats.requests.failed}`);
    console.log(`Failed Requests          : ${stats.requests.failed}`);
    console.log(`Total Test Assertions    : ${stats.assertions.total}`);
    console.log(`Passed Assertions        : ${stats.assertions.total - stats.assertions.failed}`);
    console.log(`Failed Assertions        : ${stats.assertions.failed}`);
    console.log('================================================================');

    if (failures && failures.length > 0) {
      console.log(`\n❌ Failed Assertions Breakdown (${failures.length}):`);
      failures.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.source?.name || 'Request'}] ${f.error?.test || 'Assertion'}`);
        console.log(`     Message: ${f.error?.message}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 ALL BUILDOPS AI POSTMAN TESTS PASSED 100% SUCCESSFULLY!\n');
      process.exit(0);
    }
  }
);
