// Example File for Git Diff Review Plugin
// This file is created to test the auto-stage-changes.js script

function exampleGitDiffReview() {
  console.log('Testing Git Diff Review plugin');
  console.log('This file should be automatically staged');

  return {
    status: 'success',
    message: 'Plugin working correctly!'
  };
}

module.exports = { exampleGitDiffReview };
