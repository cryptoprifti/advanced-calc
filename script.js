/**
 * Advanced Calculator Application
 * Features: Basic/Scientific modes, Memory functions, History, Keyboard support
 */

class Calculator {
    constructor() {
        // State
        this.currentValue = '0';
        this.expression = '';
        this.lastResult = null;
        this.memory = 0;
        this.hasMemory = false;
        this.history = [];
        this.isScientificMode = false;
        this.shouldResetOnNextInput = false;

        // DOM Elements
        this.resultDisplay = document.getElementById('result');
        this.expressionDisplay = document.getElementById('expression');
        this.historyPanel = document.getElementById('historyPanel');
        this.historyList = document.getElementById('historyList');
        this.scientificRow = document.getElementById('scientificRow');

        // Initialize
        this.bindEvents();
        this.loadHistory();
    }

    bindEvents() {
        // Number buttons
        document.querySelectorAll('[data-value]').forEach(btn => {
            btn.addEventListener('click', () => this.inputNumber(btn.dataset.value));
        });

        // Action buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => this.handleAction(btn.dataset.action));
        });

        // Mode toggle
        document.getElementById('basicModeBtn').addEventListener('click', () => this.setMode('basic'));
        document.getElementById('sciModeBtn').addEventListener('click', () => this.setMode('scientific'));

        // History toggle
        document.getElementById('historyToggle').addEventListener('click', () => this.toggleHistory());
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());

        // Copy functionality
        document.getElementById('copyBtn').addEventListener('click', () => this.copyResult());

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Button press animation and ripple effect
        document.querySelectorAll('.btn, .mem-btn, .sci-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                btn.classList.add('pressed');
                setTimeout(() => btn.classList.remove('pressed'), 150);
                this.createRipple(e, btn);
            });
        });
    }

    inputNumber(num) {
        if (this.shouldResetOnNextInput) {
            this.currentValue = num === '.' ? '0.' : num;
            this.expression = '';
            this.shouldResetOnNextInput = false;
        } else {
            // Auto-insert multiplication if typing a number after a closing parenthesis
            if (this.currentValue === '0' && this.expression.trim().endsWith(')')) {
                this.expression += ' × ';
            }

            if (this.currentValue === '0' && num !== '.') {
                this.currentValue = num;
            } else if (num === '.' && this.currentValue.includes('.')) {
                return; // Prevent multiple decimals
            } else {
                this.currentValue += num;
            }
        }
        this.updateDisplay();
    }

    handleAction(action) {
        switch (action) {
            // Basic operations
            case 'add':
                this.appendOperator('+');
                break;
            case 'subtract':
                this.appendOperator('-');
                break;
            case 'multiply':
                this.appendOperator('×');
                break;
            case 'divide':
                this.appendOperator('÷');
                break;
            case 'percent':
                this.calculatePercent();
                break;
            case 'equals':
                this.calculate();
                break;
            case 'clear':
                this.clear();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'decimal':
                this.inputNumber('.');
                break;
            case 'negate':
                this.negate();
                break;
            case 'openParen':
                this.appendParen('(');
                break;
            case 'closeParen':
                this.appendParen(')');
                break;

            // Memory operations
            case 'mc':
                this.memoryClear();
                break;
            case 'mr':
                this.memoryRecall();
                break;
            case 'm+':
                this.memoryAdd();
                break;
            case 'm-':
                this.memorySubtract();
                break;
            case 'ms':
                this.memoryStore();
                break;

            // Scientific operations
            case 'sin':
                this.scientificOp('sin');
                break;
            case 'cos':
                this.scientificOp('cos');
                break;
            case 'tan':
                this.scientificOp('tan');
                break;
            case 'log':
                this.scientificOp('log');
                break;
            case 'ln':
                this.scientificOp('ln');
                break;
            case 'sqrt':
                this.scientificOp('sqrt');
                break;
            case 'square':
                this.scientificOp('square');
                break;
            case 'power':
                this.appendOperator('^');
                break;
            case 'factorial':
                this.scientificOp('factorial');
                break;
            case 'pi':
                this.insertConstant(Math.PI);
                break;
            case 'e':
                this.insertConstant(Math.E);
                break;
            case 'abs':
                this.scientificOp('abs');
                break;
        }
    }

    appendOperator(op) {
        if (this.shouldResetOnNextInput) {
            this.expression = this.currentValue + ' ' + op + ' ';
            this.shouldResetOnNextInput = false;
        } else {
            this.expression = this.getFullExpression() + ' ' + op + ' ';
        }
        this.currentValue = '0';
        this.updateDisplay();
    }

    appendParen(paren) {
        if (paren === '(') {
            if (this.currentValue !== '0') {
                this.expression += this.currentValue + ' × ( ';
            } else if (this.expression.trim().endsWith(')')) {
                this.expression += ' × ( ';
            } else {
                this.expression += '( ';
            }
            this.currentValue = '0';
        } else {
            this.expression = this.getFullExpression() + ' ) ';
            this.currentValue = '0';
        }
        this.updateDisplay();
    }

    getFullExpression() {
        if (this.currentValue === '0' && this.expression.trim().endsWith(')')) {
            return this.expression;
        }
        return this.expression + this.currentValue;
    }

    calculate() {
        try {
            let fullExpression = this.getFullExpression();

            // Store the display expression before converting
            const displayExpression = fullExpression;

            // Convert display operators to JavaScript operators
            let evalExpression = fullExpression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-')
                .replace(/\^/g, '**');

            // Safety check - only allow valid math characters
            if (!/^[\d\s\+\-\*\/\.\(\)\%\*eE]+$/.test(evalExpression)) {
                throw new Error('Invalid expression');
            }

            const result = Function('"use strict"; return (' + evalExpression + ')')();

            if (!isFinite(result)) {
                throw new Error('Invalid result');
            }

            // Format result
            const formattedResult = this.formatNumber(result);

            // Add to history
            this.addToHistory(displayExpression, formattedResult);

            // Update state
            this.expression = '';
            this.currentValue = formattedResult;
            this.lastResult = result;
            this.shouldResetOnNextInput = true;

            // Animate result
            this.resultDisplay.classList.add('animate');
            setTimeout(() => this.resultDisplay.classList.remove('animate'), 200);

            this.updateDisplay();
        } catch (error) {
            this.showError();
        }
    }

    calculatePercent() {
        const value = parseFloat(this.currentValue);
        this.currentValue = this.formatNumber(value / 100);
        this.updateDisplay();
    }

    negate() {
        if (this.currentValue !== '0') {
            if (this.currentValue.startsWith('-')) {
                this.currentValue = this.currentValue.substring(1);
            } else {
                this.currentValue = '-' + this.currentValue;
            }
            this.updateDisplay();
        }
    }

    scientificOp(op) {
        const value = parseFloat(this.currentValue);
        let result;

        switch (op) {
            case 'sin':
                result = Math.sin(value * Math.PI / 180); // Degrees
                break;
            case 'cos':
                result = Math.cos(value * Math.PI / 180);
                break;
            case 'tan':
                result = Math.tan(value * Math.PI / 180);
                break;
            case 'log':
                result = Math.log10(value);
                break;
            case 'ln':
                result = Math.log(value);
                break;
            case 'sqrt':
                result = Math.sqrt(value);
                break;
            case 'square':
                result = value * value;
                break;
            case 'factorial':
                result = this.factorial(value);
                break;
            case 'abs':
                result = Math.abs(value);
                break;
        }

        if (isNaN(result) || !isFinite(result)) {
            this.showError();
            return;
        }

        this.currentValue = this.formatNumber(result);
        this.shouldResetOnNextInput = true;
        this.updateDisplay();
    }

    factorial(n) {
        if (n < 0 || !Number.isInteger(n)) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    insertConstant(value) {
        this.currentValue = this.formatNumber(value);
        this.shouldResetOnNextInput = true;
        this.updateDisplay();
    }

    // Memory functions
    memoryClear() {
        this.memory = 0;
        this.hasMemory = false;
    }

    memoryRecall() {
        if (this.hasMemory) {
            this.currentValue = this.formatNumber(this.memory);
            this.shouldResetOnNextInput = true;
            this.updateDisplay();
        }
    }

    memoryAdd() {
        this.memory += parseFloat(this.currentValue);
        this.hasMemory = true;
    }

    memorySubtract() {
        this.memory -= parseFloat(this.currentValue);
        this.hasMemory = true;
    }

    memoryStore() {
        this.memory = parseFloat(this.currentValue);
        this.hasMemory = true;
    }

    clear() {
        this.currentValue = '0';
        this.expression = '';
        this.shouldResetOnNextInput = false;
        document.querySelector('.display').classList.remove('error');
        this.updateDisplay();
    }

    backspace() {
        if (this.shouldResetOnNextInput) {
            this.clear();
            return;
        }
        if (this.currentValue.length > 1) {
            this.currentValue = this.currentValue.slice(0, -1);
        } else {
            this.currentValue = '0';
        }
        this.updateDisplay();
    }

    formatNumber(num) {
        if (Number.isInteger(num) && Math.abs(num) < 1e15) {
            return num.toString();
        }
        // Handle very large or small numbers with scientific notation
        if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
            return num.toExponential(6);
        }
        // Round to avoid floating point errors
        const formatted = parseFloat(num.toPrecision(12));
        return formatted.toString();
    }

    showError() {
        const display = document.querySelector('.display');
        display.classList.add('error');
        this.currentValue = 'Error';
        this.expression = '';
        this.shouldResetOnNextInput = true;
        this.updateDisplay();
        setTimeout(() => {
            display.classList.remove('error');
            if (this.currentValue === 'Error') {
                this.clear();
            }
        }, 1500);
    }

    updateDisplay() {
        this.resultDisplay.textContent = this.currentValue;
        this.expressionDisplay.textContent = this.expression;
    }

    copyResult() {
        const textToCopy = this.currentValue;
        if (!navigator.clipboard) return;

        navigator.clipboard.writeText(textToCopy).then(() => {
            const copyBtn = document.getElementById('copyBtn');
            copyBtn.classList.add('success');

            // Revert icon/color after 2 seconds
            setTimeout(() => {
                copyBtn.classList.remove('success');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    // Mode toggling
    setMode(mode) {
        if ((mode === 'scientific' && this.isScientificMode) ||
            (mode === 'basic' && !this.isScientificMode)) return;

        this.isScientificMode = mode === 'scientific';
        const calculator = document.getElementById('calculator');

        calculator.classList.add('mode-switching');

        document.getElementById('basicModeBtn').classList.toggle('active', !this.isScientificMode);
        document.getElementById('sciModeBtn').classList.toggle('active', this.isScientificMode);

        if (this.isScientificMode) {
            this.scientificRow.classList.add('visible');
        } else {
            this.scientificRow.classList.remove('visible');
        }

        setTimeout(() => {
            calculator.classList.remove('mode-switching');
        }, 500);
    }

    // History management
    toggleHistory() {
        this.historyPanel.classList.toggle('visible');
    }

    addToHistory(expression, result) {
        const item = {
            expression: expression.trim(),
            result: result,
            timestamp: Date.now()
        };

        this.history.unshift(item);

        // Keep only last 50 items
        if (this.history.length > 50) {
            this.history.pop();
        }

        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = `
                <div class="history-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p>No calculations yet</p>
                </div>
            `;
            return;
        }

        this.historyList.innerHTML = this.history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="expression">${this.escapeHtml(item.expression)}</div>
                <div class="result">= ${this.escapeHtml(item.result)}</div>
            </div>
        `).join('');

        // Add click handlers to history items
        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.currentValue = this.history[index].result;
                this.shouldResetOnNextInput = true;
                this.updateDisplay();
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }

    saveHistory() {
        try {
            localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        } catch (e) {
            // localStorage might not be available
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('calculatorHistory');
            if (saved) {
                this.history = JSON.parse(saved);
                this.renderHistory();
            }
        } catch (e) {
            this.history = [];
        }
    }

    // Keyboard support
    handleKeyboard(e) {
        // Prevent default for calculator keys
        if (/^[0-9\.\+\-\*\/\=\(\)]$/.test(e.key) ||
            ['Enter', 'Backspace', 'Escape', 'Delete'].includes(e.key)) {
            e.preventDefault();
        }

        // Numbers
        if (/^[0-9]$/.test(e.key)) {
            this.inputNumber(e.key);
            this.highlightButton(`[data-value="${e.key}"]`);
        }
        // Decimal
        else if (e.key === '.') {
            this.inputNumber('.');
            this.highlightButton('[data-action="decimal"]');
        }
        // Operators
        else if (e.key === '+') {
            this.handleAction('add');
            this.highlightButton('[data-action="add"]');
        }
        else if (e.key === '-') {
            this.handleAction('subtract');
            this.highlightButton('[data-action="subtract"]');
        }
        else if (e.key === '*') {
            this.handleAction('multiply');
            this.highlightButton('[data-action="multiply"]');
        }
        else if (e.key === '/') {
            this.handleAction('divide');
            this.highlightButton('[data-action="divide"]');
        }
        // Equals/Enter
        else if (e.key === '=' || e.key === 'Enter') {
            this.handleAction('equals');
            this.highlightButton('[data-action="equals"]');
        }
        // Parentheses
        else if (e.key === '(') {
            this.handleAction('openParen');
            this.highlightButton('[data-action="openParen"]');
        }
        else if (e.key === ')') {
            this.handleAction('closeParen');
            this.highlightButton('[data-action="closeParen"]');
        }
        // Backspace
        else if (e.key === 'Backspace') {
            this.handleAction('backspace');
            this.highlightButton('[data-action="backspace"]');
        }
        // Clear (Escape or Delete)
        else if (e.key === 'Escape' || e.key === 'Delete') {
            this.handleAction('clear');
            this.highlightButton('[data-action="clear"]');
        }
        // Percent
        else if (e.key === '%') {
            this.handleAction('percent');
            this.highlightButton('[data-action="percent"]');
        }
    }

    highlightButton(selector) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), 150);
        }
    }

    createRipple(event, btn) {
        const circle = document.createElement('span');
        const diameter = Math.max(btn.clientWidth, btn.clientHeight);
        const radius = diameter / 2;

        const rect = btn.getBoundingClientRect();

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');

        const ripple = btn.getElementsByClassName('ripple')[0];

        if (ripple) {
            ripple.remove();
        }

        btn.appendChild(circle);

        // Remove ripple after animation finishes
        setTimeout(() => circle.remove(), 600);
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new Calculator();
});
