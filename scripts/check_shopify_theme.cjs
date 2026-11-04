const path = require('path');
const checker = require(process.env.EF_TEST_MODULES ? path.join(process.env.EF_TEST_MODULES,'@shopify/theme-check-node') : '@shopify/theme-check-node');
checker.check(path.resolve(__dirname,'../shopify-theme')).then(issues=>{
 for (const issue of issues) console.error(`${issue.check}: ${issue.message} (${issue.uri})`);
 console.log(`Shopify Theme Check: ${issues.length} issues`);
 if (issues.length) process.exitCode=1;
}).catch(error=>{console.error(error);process.exitCode=1;});
