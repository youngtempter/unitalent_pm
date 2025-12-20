/**
 * Script to add jQuery, animations CSS, and interactions.js to all HTML files
 * Run this with Node.js: node update-pages.js
 */

const fs = require('fs');
const path = require('path');

const htmlFiles = [
  'index.html',
  'student-login.html',
  'student-signup.html',
  'student-dashboard.html',
  'student-profile.html',
  'student-interviews.html',
  'student-sdu-login.html',
  'employer-login.html',
  'employer-signup.html',
  'employer-dashboard.html',
  'employer-profile.html',
  'employer-applicants.html',
  'employer-interviews.html',
  'employer-new-job.html',
  'employer-edit-job.html',
  'employer-browse-students.html',
  'employer-student-profile.html',
  'jobs.html',
  'jobsHH.html',
  'job-details.html',
  'saved-jobs.html',
  'contact.html',
  'forgot-password.html',
  'reset-password.html'
];

const frontendDir = __dirname;

htmlFiles.forEach(file => {
  const filePath = path.join(frontendDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Add animations CSS link (after Google Font)
  if (!content.includes('css/animations.css')) {
    const fontLinkRegex = /(<link[^>]*fonts\.googleapis\.com[^>]*>)/i;
    if (fontLinkRegex.test(content)) {
      content = content.replace(
        fontLinkRegex,
        `$1\n  <!-- Custom Animations CSS -->\n  <link rel="stylesheet" href="css/animations.css">`
      );
      modified = true;
    }
  }

  // 2. Add jQuery and interactions.js before closing </body>
  if (!content.includes('jquery.com/jquery')) {
    const bodyCloseRegex = /(\s*<\/body>\s*<\/html>)/;
    if (bodyCloseRegex.test(content)) {
      const scripts = `
  <!-- jQuery -->
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  
  <!-- jQuery Interactions -->
  <script src="js/interactions.js"></script>
`;
      content = content.replace(bodyCloseRegex, `${scripts}$1`);
      modified = true;
    }
  }

  // 3. Update mobile menu button to have id and classes
  if (content.includes('Mobile menu button') && !content.includes('id="mobileMenuBtn"')) {
    content = content.replace(
      /<!-- Mobile menu button[^>]*>[\s\S]*?<\/button>/,
      `<!-- Mobile menu button -->
      <button id="mobileMenuBtn" class="mobile-menu-btn inline-flex items-center justify-center rounded-full border border-slate-700 p-2 text-slate-200 transition-all hover:border-indigo-400 hover:text-indigo-300 md:hidden">
        <span class="sr-only">Open menu</span>
        <svg class="h-5 w-5 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>`
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${file}`);
  } else {
    console.log(`✓ Already updated: ${file}`);
  }
});

console.log('\n✨ All files processed!');

