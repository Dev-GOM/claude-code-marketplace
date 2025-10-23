// Example File for Git Diff Review Plugin
// This file is created to test the auto-stage-changes.js script
// CHANGE 1: Added new comment line here

function exampleGitDiffReview() {
  console.log('Testing Git Diff Review plugin');
  console.log('This file should be automatically staged');
  console.log('CHANGE 2: Modified this line');
  console.log('Testing improved auto-open feature');
  console.log('NOW WITH CODELENS BUTTONS!');
  console.log('CHANGE 3: Added another log line');

  return {
    status: 'success',
    message: 'Plugin working correctly!',
    version: '2.0',
    codeLens: true,
    tested: true,
    changeNumber: 4  // CHANGE 4: Added new properties
  };
}

module.exports = { exampleGitDiffReview };
