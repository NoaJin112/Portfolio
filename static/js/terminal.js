const terminalConfig = {
  user: 'noa',
  host: 'portfolio',
  currentDir: '~',
  history: [],
  historyIndex: 0,
};

function normalizePromptConfig() {
  if (terminalConfig.user !== 'noa') {
    terminalConfig.user = 'noa';
  }
  if (!terminalConfig.host) {
    terminalConfig.host = 'portfolio';
  }
  if (!terminalConfig.currentDir) {
    terminalConfig.currentDir = '~';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const inputElement = document.getElementById('terminal-input');
  const outputElement = document.getElementById('terminal-output');
  const promptElement = document.getElementById('terminal-prompt');
  const terminalBody = document.getElementById('terminal-body');
  const topBar = document.getElementById('terminal-topbar');
  const closeBtn = document.getElementById('close-btn');
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const screenshotBtn = document.getElementById('screenshot-btn');
  const container = document.querySelector('.terminal-container');

  if (promptElement) {
    const promptText = promptElement.textContent.trim();
    const match = promptText.match(/^([^@]+)@([^:]+):(.+)\$$/);
    if (match) {
      terminalConfig.user = match[1];
      terminalConfig.host = match[2];
      terminalConfig.currentDir = match[3];
    }
  }

  displayWelcome();
  inputElement.focus();

  inputElement.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      const command = inputElement.value.trim();
      if (command) {
        executeCommand(command);
        terminalConfig.history.push(command);
        terminalConfig.historyIndex = terminalConfig.history.length;
      }
      inputElement.value = '';
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (terminalConfig.historyIndex > 0) {
        terminalConfig.historyIndex--;
        inputElement.value = terminalConfig.history[terminalConfig.historyIndex];
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (terminalConfig.historyIndex < terminalConfig.history.length - 1) {
        terminalConfig.historyIndex++;
        inputElement.value = terminalConfig.history[terminalConfig.historyIndex];
      } else {
        terminalConfig.historyIndex = terminalConfig.history.length;
        inputElement.value = '';
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      autocomplete();
    }
  });

  closeBtn.addEventListener('click', function() {
    window.location.href = '/';
  });

  minimizeBtn.addEventListener('click', function() {
    terminalBody.style.display = terminalBody.style.display === 'none' ? 'flex' : 'none';
    topBar.style.borderBottomLeftRadius = terminalBody.style.display === 'none' ? '12px' : '0';
    topBar.style.borderBottomRightRadius = terminalBody.style.display === 'none' ? '12px' : '0';
  });

  maximizeBtn.addEventListener('click', function() {
    container.style.maxWidth = container.style.maxWidth === '100%' ? '900px' : '100%';
    container.style.height = container.style.height === '100vh' ? '500px' : '100vh';
    topBar.style.borderRadius = container.style.height === '100vh' ? '0' : '12px 12px 0 0';
  });

  screenshotBtn.addEventListener('click', function() {
    const element = container;
    html2canvas(element).then(function(canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'terminal-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
      link.click();
    });
  });

  container.addEventListener('click', function() {
    inputElement.focus();
  });

  document.addEventListener('keydown', function(event) {
    if (document.activeElement !== inputElement && event.key.length === 1) {
      inputElement.focus();
      inputElement.dispatchEvent(new KeyboardEvent('keydown', {
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        which: event.which,
        bubbles: true
      }));
    }
  }, true);
});

function displayWelcome() {
  const output = document.getElementById('terminal-output');
  const welcomeMsg = document.createElement('div');
  welcomeMsg.innerHTML = `
    <div class="command-info">Welkom op mijn persoonlijke terminal!</div>
    <div class="command-success">Type 'help' om de beschikbare commando's te zien.</div>
    <div></div>
  `;
  output.appendChild(welcomeMsg);
}

function executeCommand(command) {
  const output = document.getElementById('terminal-output');
  const promptElement = document.getElementById('terminal-prompt');

  normalizePromptConfig();
  
  const cmdDisplay = document.createElement('div');
  cmdDisplay.style.color = '#34d399';
  cmdDisplay.textContent = `${terminalConfig.user}@${terminalConfig.host}:${terminalConfig.currentDir}$ ${command}`;
  output.appendChild(cmdDisplay);

  const parts = command.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);

  const result = handleCommand(cmd, args, command);
  
  if (result) {
    output.appendChild(result);
  }

  normalizePromptConfig();
  promptElement.textContent = `${terminalConfig.user}@${terminalConfig.host}:${terminalConfig.currentDir}$`;
  
  document.getElementById('terminal-body').scrollTop = document.getElementById('terminal-body').scrollHeight;
}

function handleCommand(cmd, args, fullCommand) {
  const output = document.createElement('div');

  const commands = {
    'help': () => {
      const help = document.createElement('div');
      help.innerHTML = `
        <div class="command-info">Available commands:</div>
        <div>  help          - Show this help message</div>
        <div>  clear         - Clear the terminal</div>
        <div>  whoami        - Show current user</div>
        <div>  pwd           - Print working directory</div>
        <div>  date          - Show current date and time</div>
        <div>  echo [text]   - Print text</div>
        <div>  about         - Learn about Noa</div>
        <div>  skills        - Show technical skills</div>
        <div>  projects      - List projects</div>
        <div>  contact       - Show contact information</div>
        <div>  exit          - Exit terminal</div>
      `;
      return help;
    },
    'clear': () => {
      document.getElementById('terminal-output').innerHTML = '';
      return null;
    },
    'whoami': () => {
      output.textContent = terminalConfig.user;
      return output;
    },
    'pwd': () => {
      output.textContent = terminalConfig.currentDir;
      return output;
    },
    'date': () => {
      output.textContent = new Date().toLocaleString();
      return output;
    },
    'echo': () => {
      output.textContent = args.join(' ');
      return output;
    },
    'about': () => {
      output.innerHTML = `
        <div class="command-info">About Noa</div>
        <div>────────────────────────────────────</div>
        <div>Full Stack Developer | Designer | Creator</div>
        <div></div>
        <div>I'm passionate about building beautiful and</div>
        <div>functional web applications using modern</div>
        <div>technologies.</div>
        <div></div>
        <div>Location: Planet Earth 🌍</div>
        <div>Status: Always Learning 📚</div>
      `;
      return output;
    },
    'skills': () => {
      output.innerHTML = `
        <div class="command-info">Technical Skills</div>
        <div>────────────────────────────────────</div>
        <div>Frontend:  React, HTML, CSS, TailwindCSS</div>
        <div>Backend:   Django, Python, Node.js</div>
        <div>Database:  PostgreSQL, MongoDB</div>
        <div>Tools:     Git, Docker, VS Code</div>
      `;
      return output;
    },
    'projects': () => {
      output.innerHTML = `
        <div class="command-info">Featured Projects</div>
        <div>────────────────────────────────────</div>
        <div>1. E-Commerce Platform - Full-stack marketplace</div>
        <div>2. Analytics Dashboard - Real-time data viz</div>
        <div>3. Mobile App - Cross-platform application</div>
        <div>4. SaaS Platform - Subscription management</div>
        <div></div>
        <div>Visit /projects for more details</div>
      `;
      return output;
    },
    'contact': () => {
      output.innerHTML = `
        <div class="command-info">Get in Touch</div>
        <div>────────────────────────────────────</div>
        <div>Email:   contact@portfolio.dev</div>
        <div>GitHub:  github.com/noaexample</div>
        <div>Twitter: @noaexample</div>
        <div>LinkedIn: linkedin.com/in/noaexample</div>
      `;
      return output;
    },
    'exit': () => {
      window.location.href = '/';
      return null;
    },
  };

  if (commands[cmd]) {
    return commands[cmd]();
  } else if (cmd === '') {
    return null;
  } else {
    output.classList.add('command-error');
    output.textContent = `command not found: ${cmd}`;
    return output;
  }
}

function autocomplete() {
  const inputElement = document.getElementById('terminal-input');
  const currentValue = inputElement.value.trim().split(' ')[0];
  
  const availableCommands = [
    'help', 'clear', 'whoami', 'pwd', 'date', 'echo', 
    'about', 'skills', 'projects', 'contact', 'exit'
  ];

  const matches = availableCommands.filter(cmd => cmd.startsWith(currentValue));
  
  if (matches.length === 1) {
    inputElement.value = matches[0];
  } else if (matches.length > 1) {
    console.log('Matches:', matches.join(', '));
  }
}
