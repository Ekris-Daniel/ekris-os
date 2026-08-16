window.CalculatorApp = {
    title: "Calculator",
    id: "calculator",
    init: (container, kernel) => {
        const style = document.createElement('style');
        style.textContent = `
            .calc-wrapper {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: #0d1117;
                padding: 15px;
                font-family: 'Fira Code', monospace;
            }
            .calc-display {
                background: #161b22;
                border: 1px solid #30363d;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                text-align: right;
                min-height: 70px;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
            }
            .calc-expr {
                color: #8b949e;
                font-size: 0.8rem;
                min-height: 20px;
                word-break: break-all;
            }
            .calc-result {
                color: #f0f6fc;
                font-size: 1.8rem;
                font-weight: 700;
                word-break: break-all;
            }
            .calc-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                flex-grow: 1;
            }
            .calc-btn {
                background: #161b22;
                border: 1px solid #30363d;
                border-radius: 8px;
                color: #f0f6fc;
                font-family: 'Fira Code', monospace;
                font-size: 1.1rem;
                cursor: pointer;
                transition: all 0.15s;
                padding: 10px;
            }
            .calc-btn:hover { background: #1f2937; border-color: #58a6ff; }
            .calc-btn:active { transform: scale(0.95); }
            .calc-btn.op { color: #58a6ff; }
            .calc-btn.fn { color: #3fb950; font-size: 0.85rem; }
            .calc-btn.clear { color: #f85149; }
            .calc-btn.eq {
                background: #58a6ff;
                color: #0d1117;
                font-weight: 700;
                grid-column: span 2;
            }
            .calc-btn.eq:hover { background: #79c0ff; }
            .calc-mode-toggle {
                display: flex;
                gap: 8px;
                margin-bottom: 10px;
            }
            .calc-mode-btn {
                flex: 1;
                padding: 6px;
                background: #161b22;
                border: 1px solid #30363d;
                border-radius: 6px;
                color: #8b949e;
                font-family: 'Fira Code', monospace;
                font-size: 0.75rem;
                cursor: pointer;
                transition: all 0.15s;
            }
            .calc-mode-btn.active {
                color: #58a6ff;
                border-color: #58a6ff;
                background: rgba(88, 166, 255, 0.1);
            }
            .calc-history {
                margin-top: 10px;
                max-height: 80px;
                overflow-y: auto;
                font-size: 0.7rem;
                color: #484f58;
            }
            .calc-history div { padding: 2px 0; }
        `;
        container.appendChild(style);

        container.innerHTML += `
            <div class="calc-wrapper">
                <div class="calc-display">
                    <div class="calc-expr" id="calc-expr"></div>
                    <div class="calc-result" id="calc-result">0</div>
                </div>
                <div class="calc-mode-toggle">
                    <button class="calc-mode-btn active" data-mode="basic">BASIC</button>
                    <button class="calc-mode-btn" data-mode="sci">SCIENTIFIC</button>
                </div>
                <div class="calc-grid" id="calc-grid"></div>
                <div class="calc-history" id="calc-history"></div>
            </div>
        `;

        const exprEl = container.querySelector('#calc-expr');
        const resultEl = container.querySelector('#calc-result');
        const gridEl = container.querySelector('#calc-grid');
        const historyEl = container.querySelector('#calc-history');

        let current = '0';
        let expression = '';
        let lastResult = null;
        let mode = 'basic';
        const history = [];

        const basicBtns = [
            { label: 'C', cls: 'clear', action: 'clear' },
            { label: 'DEL', cls: 'clear', action: 'del' },
            { label: '%', cls: 'op', action: 'op', val: '%' },
            { label: '/', cls: 'op', action: 'op', val: '/' },
            { label: '7', action: 'num', val: '7' },
            { label: '8', action: 'num', val: '8' },
            { label: '9', action: 'num', val: '9' },
            { label: '*', cls: 'op', action: 'op', val: '*' },
            { label: '4', action: 'num', val: '4' },
            { label: '5', action: 'num', val: '5' },
            { label: '6', action: 'num', val: '6' },
            { label: '-', cls: 'op', action: 'op', val: '-' },
            { label: '1', action: 'num', val: '1' },
            { label: '2', action: 'num', val: '2' },
            { label: '3', action: 'num', val: '3' },
            { label: '+', cls: 'op', action: 'op', val: '+' },
            { label: '(', cls: 'op', action: 'num', val: '(' },
            { label: '0', action: 'num', val: '0' },
            { label: '.', action: 'num', val: '.' },
            { label: ')', cls: 'op', action: 'num', val: ')' },
            { label: '=', cls: 'eq', action: 'eq' },
            { label: '+/-', cls: 'fn', action: 'negate' },
        ];

        const sciBtns = [
            { label: 'C', cls: 'clear', action: 'clear' },
            { label: 'DEL', cls: 'clear', action: 'del' },
            { label: '(', cls: 'op', action: 'num', val: '(' },
            { label: ')', cls: 'op', action: 'num', val: ')' },
            { label: 'sin', cls: 'fn', action: 'fn', val: 'Math.sin' },
            { label: 'cos', cls: 'fn', action: 'fn', val: 'Math.cos' },
            { label: 'tan', cls: 'fn', action: 'fn', val: 'Math.tan' },
            { label: '/', cls: 'op', action: 'op', val: '/' },
            { label: 'ln', cls: 'fn', action: 'fn', val: 'Math.log' },
            { label: 'log', cls: 'fn', action: 'fn', val: 'Math.log10' },
            { label: 'x^2', cls: 'fn', action: 'pow2' },
            { label: '*', cls: 'op', action: 'op', val: '*' },
            { label: 'sqrt', cls: 'fn', action: 'fn', val: 'Math.sqrt' },
            { label: 'PI', cls: 'fn', action: 'const', val: 'Math.PI' },
            { label: 'e', cls: 'fn', action: 'const', val: 'Math.E' },
            { label: '-', cls: 'op', action: 'op', val: '-' },
            { label: '7', action: 'num', val: '7' },
            { label: '8', action: 'num', val: '8' },
            { label: '9', action: 'num', val: '9' },
            { label: '+', cls: 'op', action: 'op', val: '+' },
            { label: '4', action: 'num', val: '4' },
            { label: '5', action: 'num', val: '5' },
            { label: '6', action: 'num', val: '6' },
            { label: 'x^y', cls: 'fn', action: 'op', val: '**' },
            { label: '1', action: 'num', val: '1' },
            { label: '2', action: 'num', val: '2' },
            { label: '3', action: 'num', val: '3' },
            { label: '%', cls: 'op', action: 'op', val: '%' },
            { label: '+/-', cls: 'fn', action: 'negate' },
            { label: '0', action: 'num', val: '0' },
            { label: '.', action: 'num', val: '.' },
            { label: '=', cls: 'eq', action: 'eq' },
        ];

        function renderGrid() {
            const btns = mode === 'basic' ? basicBtns : sciBtns;
            gridEl.innerHTML = '';
            btns.forEach(b => {
                const btn = document.createElement('button');
                btn.className = 'calc-btn' + (b.cls ? ' ' + b.cls : '');
                btn.textContent = b.label;
                btn.addEventListener('click', () => handleBtn(b));
                gridEl.appendChild(btn);
            });
        }

        function updateDisplay() {
            exprEl.textContent = expression;
            resultEl.textContent = current;
        }

        function handleBtn(b) {
            switch (b.action) {
                case 'num':
                    if (current === '0' && b.val !== '.' && b.val !== '(' && b.val !== ')') {
                        current = b.val;
                    } else {
                        current += b.val;
                    }
                    expression += b.val;
                    break;
                case 'op':
                    expression += ' ' + b.val + ' ';
                    current = '';
                    break;
                case 'fn':
                    expression += b.val + '(';
                    current = b.label + '(';
                    break;
                case 'const':
                    const constVal = eval(b.val);
                    expression += b.val;
                    current = String(constVal);
                    break;
                case 'pow2':
                    expression = '(' + expression + ')**2';
                    current += '^2';
                    break;
                case 'negate':
                    if (current && current !== '0') {
                        if (current.startsWith('-')) {
                            current = current.slice(1);
                        } else {
                            current = '-' + current;
                        }
                        expression = current;
                    }
                    break;
                case 'clear':
                    current = '0';
                    expression = '';
                    lastResult = null;
                    break;
                case 'del':
                    expression = expression.trimEnd().slice(0, -1);
                    current = current.slice(0, -1) || '0';
                    break;
                case 'eq':
                    try {
                        const safeExpr = expression.replace(/[^0-9+\-*/.()%eE\s]|Math\.\w+/g, (m) => {
                            if (m.startsWith('Math.')) return m;
                            return '';
                        });
                        const result = Function('"use strict"; return (' + expression + ')')();
                        const rounded = Math.round(result * 1e10) / 1e10;
                        history.unshift(`${expression} = ${rounded}`);
                        if (history.length > 10) history.pop();
                        renderHistory();
                        lastResult = rounded;
                        current = String(rounded);
                        expression = String(rounded);
                    } catch (e) {
                        current = 'Error';
                        expression = '';
                    }
                    break;
            }
            updateDisplay();
        }

        function renderHistory() {
            historyEl.innerHTML = history.map(h => `<div>${h}</div>`).join('');
        }

        container.querySelectorAll('.calc-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.calc-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                mode = btn.dataset.mode;
                renderGrid();
            });
        });

        renderGrid();
        updateDisplay();

        if (kernel) kernel.registerSymbol(['calculator', 'calc', 'math']);
    }
};
