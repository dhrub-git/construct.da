const screenTabs = document.querySelectorAll('[data-screen-target]');
const screens = document.querySelectorAll('.screen');
const jumpButtons = document.querySelectorAll('[data-jump]');

function setActiveScreen(id) {
  screenTabs.forEach((tab) => {
    const isActive = tab.dataset.screenTarget === id;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
}

screenTabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveScreen(tab.dataset.screenTarget));
});

jumpButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveScreen(button.dataset.jump));
});

const stepTitles = [
  'What are you planning?',
  'Where is it?',
  'What is changing?',
  'Upload evidence',
  'Review + likely path',
];

const stepperButtons = document.querySelectorAll('.step');
const stepPanels = document.querySelectorAll('.step-panel');
const stepTitle = document.getElementById('step-title');
const stepCount = document.getElementById('step-count');
const prevStepButton = document.getElementById('prev-step');
const nextStepButton = document.getElementById('next-step');
const saveExitButton = document.getElementById('save-exit');
let currentStep = 0;

function renderStep(stepIndex) {
  currentStep = Math.max(0, Math.min(stepIndex, stepPanels.length - 1));
  stepperButtons.forEach((button, index) => button.classList.toggle('active', index === currentStep));
  stepPanels.forEach((panel, index) => panel.classList.toggle('active', index === currentStep));
  if (stepTitle) stepTitle.textContent = stepTitles[currentStep];
  if (stepCount) stepCount.textContent = `Step ${currentStep + 1} of ${stepPanels.length}`;
  if (prevStepButton) prevStepButton.disabled = currentStep === 0;
  if (nextStepButton) nextStepButton.textContent = currentStep === stepPanels.length - 1 ? 'Run advisory concept' : 'Next step';
}

stepperButtons.forEach((button, index) => {
  button.addEventListener('click', () => renderStep(index));
});

prevStepButton?.addEventListener('click', () => renderStep(currentStep - 1));
nextStepButton?.addEventListener('click', () => {
  if (currentStep === stepPanels.length - 1) {
    nextStepButton.textContent = 'Analyzing...';
    nextStepButton.disabled = true;
    setTimeout(() => {
      setActiveScreen('dashboard');
      nextStepButton.disabled = false;
      renderStep(0);
    }, 800);
    return;
  }
  renderStep(currentStep + 1);
});
saveExitButton?.addEventListener('click', () => setActiveScreen('landing'));

const filterChips = document.querySelectorAll('.filter-chip');
const findings = document.querySelectorAll('.finding-detail');

filterChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const filter = chip.dataset.filter;
    filterChips.forEach((item) => item.classList.toggle('active', item === chip));

    findings.forEach((finding) => {
      const matches = filter === 'all' || finding.dataset.severity === filter;
      finding.classList.toggle('hidden', !matches);
    });
  });
});

const choiceGroups = document.querySelectorAll('.choice-grid');
choiceGroups.forEach((group) => {
  group.querySelectorAll('.choice-card').forEach((card) => {
    card.addEventListener('click', () => {
      group.querySelectorAll('.choice-card').forEach((item) => {
        item.classList.remove('selected');
        item.setAttribute('aria-checked', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
    });
  });
});

// Upload dropzone drag-over feedback
const dropzone = document.querySelector('.upload-dropzone');
if (dropzone) {
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  });
}

renderStep(0);
