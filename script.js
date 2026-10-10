const submission_iframe_selector = 'iframe#submission-preview-iframe, iframe#speedgrader_iframe';
const watched_iframes = new WeakSet();
let elements_hidden = true;

if (location.href.includes('/gradebook/speed_grader')) {
  update_page();
  // The React SpeedGrader mounts and replaces these elements asynchronously.
  new MutationObserver(update_page).observe(document.body, {
    childList: true,
    subtree: true,
  });
  document.addEventListener('keydown', hotkeys);
}

function update_page() {
  insert_help();
  const iframe = document.querySelector(submission_iframe_selector);
  if (iframe && !watched_iframes.has(iframe)) {
    watched_iframes.add(iframe);
    iframe.addEventListener('load', update_page);
  }
  if (elements_hidden) inject_styles();
}

function inject_styles() {
  elements_hidden = true;
  if (!document.querySelector('style#pcrq')) {
    const style = document.createElement('style');
    style.id = 'pcrq';
    style.textContent = `div#flash_message_holder,
      div#submission_not_newest_notice, div:has(>form#add_a_comment),
      div#submission_details, div.secondary_mount_point_container,
      [data-testid="single-submission-info"],
      div:has(> section [data-testid="assignment-comment-input"]) { display:
      none; }`;
    document.head.appendChild(style);
  }
  const iframe = document.querySelector(submission_iframe_selector);
  if (!iframe || !iframe.contentDocument || !iframe.contentDocument.head ||
    !iframe.contentDocument.querySelector('div#questions')) return;
  if (!iframe.contentDocument.querySelector('style#pcrq')) {
    const style = document.createElement('style');
    style.id = 'pcrq';
    style.textContent = `div.alert, div.quiz_score, div.quiz_duration,
      div.question_text, div.quiz_comment, div.update_scores_fudge { display:
      none; } div[aria-label="Question"] { display: none; }
      div[aria-label="Question"]:has(input.question_input_hidden[value=""]) {
      display: block; }`;
    iframe.contentDocument.head.appendChild(style);
  }
  iframe.style.display = '';
}

function insert_help() {
  const sidebar = document.querySelector('[data-testid="speedgrader-grading-panel"], div#rightside_inner');
  if (!sidebar || sidebar.querySelector('#pcrq-help')) return;
  // Keep the reference at the top of the sidebar's scrollable grading content.
  const content = sidebar.querySelector('[data-testid="assessment"]') || sidebar;
  const table = `<div id="pcrq-help" style="padding: 12px; position: sticky; top: 0; z-index: 1; background: #fff; flex-shrink: 0;">
    <h3 style="font-size: 1rem; margin: 0 0 8px;">PCRQ keyboard shortcuts</h3>
    <p style="margin: 0 0 8px;">Scores apply only to ungraded questions.</p>
    <table style="width: 100%; border-collapse: separate; border-spacing: 8px 4px; text-align: left;">
    <tr><th scope="col">Key</th><th scope="col">Function</th></tr>
    <tr><td><kbd>z</kbd></td><td>Full marks and save</td></tr>
    <tr><td><kbd>x</kbd></td><td>Zero points and save</td></tr>
    <tr><td><kbd>&larr;</kbd></td><td>Previous student</td></tr>
    <tr><td><kbd>&rarr;</kbd></td><td>Next student</td></tr>
    <tr><td><kbd>h</kbd></td><td>Hide extra elements</td></tr>
    <tr><td><kbd>s</kbd></td><td>Show all elements</td></tr>
    </table>
    <p>If the shortcut keys aren't working, try clicking on the sidebar.</p>
    <p style="text-align: center;"><a href="https://github.com/dongryul-kim/canvas-pcrq">Link to GitHub repository</a></p></div>`;
  // Preserve Canvas's existing controls and their event handlers.
  content.insertAdjacentHTML('afterbegin', table);
}

function grade(full_score) {
  const iframe = document.querySelector(submission_iframe_selector);
  const save = iframe?.contentDocument?.querySelector('button.update-scores');
  if (!save) return;
  for (const q of iframe.contentDocument.querySelectorAll('div[aria-label="Question"]')) {
    const i = q.querySelector('input.question_input_hidden');
    if (i && i.getAttribute('value') === '') {
      const pts = q.querySelector('span.question_points').textContent.replace(/^\s*\/\s*/, '').trim();
      i.setAttribute('value', full_score ? pts : '0');
    }
  }
  iframe.style.display = 'none';
  save.click();
}

function hotkeys(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
  switch (e.key) {
    case 'z':
      grade(true);
      break;
    case 'x':
      grade(false);
      break;
    case 'ArrowRight':
      document.querySelector('button#next-student-button')?.click();
      inject_styles();
      break;
    case 'ArrowLeft':
      document.querySelector('button#prev-student-button')?.click();
      inject_styles();
      break;
    case 'h':
      inject_styles();
      break;
    case 's':
      elements_hidden = false;
      document.querySelector('style#pcrq')?.remove();
      const iframe = document.querySelector(submission_iframe_selector);
      iframe?.contentDocument?.querySelector('style#pcrq')?.remove();
      if (iframe) iframe.style.display = '';
      break;
  }
}
