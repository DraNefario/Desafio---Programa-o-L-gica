class LogicFormulaConverter {
    constructor() {
        this.variables = new Set();
        this.steps = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const convertBtn = document.getElementById('convert-btn');
        const clearBtn = document.getElementById('clear-btn');
        const formulaInput = document.getElementById('formula-input');

        convertBtn.addEventListener('click', () => this.convertFormula());
        clearBtn.addEventListener('click', () => this.clearAll());
        
        formulaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.convertFormula();
            }
        });
    }

    clearAll() {
        document.getElementById('formula-input').value = '';
        document.getElementById('original-formula').innerHTML = 'Digite uma fórmula para começar';
        document.getElementById('conversion-steps').innerHTML = 'Os passos aparecerão aqui após a conversão';
        document.getElementById('pcnf-result').innerHTML = 'Resultado PCNF aparecerá aqui';
        document.getElementById('pdnf-result').innerHTML = 'Resultado PDNF aparecerá aqui';
        document.getElementById('clausal-result').innerHTML = 'Resultado da forma cláusal aparecerá aqui';
        document.getElementById('horn-result').innerHTML = 'Resultado das cláusulas de Horn aparecerá aqui';
        this.variables.clear();
        this.steps = [];
    }

    async convertFormula() {
        const input = document.getElementById('formula-input').value.trim();
        
        if (!input) {
            this.showError('Por favor, digite uma fórmula válida.');
            return;
        }

        try {
            // mostrando o estado de carregamento
            this.showLoading();
            
            // reset dos passos e das variaveis
            this.steps = [];
            this.variables.clear();
            
            // mostra a formula original
            this.displayOriginalFormula(input);
            
            // analise e validaçao da formula
            const parsedFormula = this.parseFormula(input);
            
            // passo 1: eliminar implicaçoes e bicondicionais
            const step1 = this.eliminateImplications(parsedFormula);
            this.addStep('Eliminação de Implicações e Biimpicações', step1);
            
            // passo 2: mover as negaçoes para dentro 
            const step2 = this.moveNegationsInward(step1);
            this.addStep('Forma Normal de Negação (NNF)', step2);
            
            // passo 3: renomeando variaveis vinculadas
            const step3 = this.renameBoundVariables(step2);
            this.addStep('Renomeação de Variáveis Ligadas', step3);
            
            // passo 4: mover os quantificadores para fora
            const step4 = this.moveToPrenexForm(step3);
            this.addStep('Forma Prenex', step4);
            
            // passo 5: converte PCNF
            const pcnf = this.convertToPCNF(step4);
            this.displayResult('pcnf-result', pcnf);
            
            // passo 6:  converte para PDNF  
            const pdnf = this.convertToPDNF(step4);
            this.displayResult('pdnf-result', pdnf);
            
            // passo 7: Skolemização e conversão para forma normal conjuntiva
            const clausalObj = this.convertToClausalForm(pcnf);
            this.displayResult('clausal-result', clausalObj.display);
            
            // passo 8: conversao para clausula de horn
            const horn = this.convertToHornClauses(clausalObj.clauses);
            this.displayResult('horn-result', horn);
            
            // mostra todps os passos
            this.displaySteps();
            
        } catch (error) {
            this.showError(`Erro na conversão: ${error.message}`);
        }
    }

    parseFormula(input) {
        // Analisador de fórmula simples para sintaxe lógica básica do LaTeX
        
        // substitui os simbolos latex por representaçao interna
        let formula = input
            .replace(/\\forall/g, '∀')
            .replace(/\\exists/g, '∃')
            .replace(/\\rightarrow/g, '→')
            .replace(/\\leftrightarrow/g, '↔')
            .replace(/\\land/g, '∧')
            .replace(/\\lor/g, '∨')
            .replace(/\\neg|\\lnot/g, '¬');
            
        // extraçao de variaveis
        const nameOnly = [...formula.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)] || [];
        nameOnly.forEach(m => this.variables.add(m[11]));

        return {
            original: input,
            processed: formula,
            type: this.detectFormulaType(formula)
        };
    }

    //detecssao de formula, se ∀ ou ∃ entao é de primeira ordem, se nao é proposicional
    detectFormulaType(formula) {
        if (formula.includes('∀') || formula.includes('∃')) {
            return 'first-order';
        }
        return 'propositional';
    }

    eliminateImplications(parsedFormula) {
        let result = parsedFormula.processed;
        
        result = result.replace(/([^↔]+)↔([^↔]+)/g, '(($1) → ($2)) ∧ (($2) → ($1))');
        result = result.replace(/([^→]+)→([^→]+)/g, '¬($1) ∨ ($2)');

        return result;
    }

    moveNegationsInward(formula) {
        let result = formula;
        
        // De Morgan
        result = result.replace(/¬\(([^)]+)∧([^)]+)\)/g, '¬$1 ∨ ¬$2');
        result = result.replace(/¬\(([^)]+)∨([^)]+)\)/g, '¬$1 ∧ ¬$2');

        // Dupla negação
        result = result.replace(/¬¬/g, '');

        // Quantificadores (simplificado)
        result = result.replace(/¬∀([a-zA-Z]+)/g, '∃$1¬');
        result = result.replace(/¬∃([a-zA-Z]+)/g, '∀$1¬');

        return result;
    }

    #replaceVarSafe(text, oldName, newName) {
        const re = new RegExp(`\\b${oldName}\\b`, 'g');
        return text.replace(re, newName);
    }

    renameBoundVariables(formula) {
        // renomeaçao de variaveis para evitar conflito
        let result = formula;
        let variableCounter = 1;
        
        const boundVars = result.match(/[∀∃]([a-zA-Z]+)/g) || [];
        const usedNames = new Set();
        
        boundVars.forEach(match => {
            const varName = match.substring(1);
            if (usedNames.has(varName)) {
                const newName = varName + variableCounter++;
                result = this.#replaceVarSafe(result, varName, newName);
            }
            usedNames.add(varName);
        });
        
        return result;
    }

    moveToPrenexForm(formula) {
        let result = formula;

        // Extrai quantificadores simples e remove do corpo
        const quantifiers = [];
        const quantifierMatches = result.match(/[∀∃][a-zA-Z]+/g) || [];

        quantifierMatches.forEach(q => {
            quantifiers.push(q);
            // remove só esta ocorrência (uma vez por iteração)
            result = result.replace(q, '');
        });

        // Normaliza espaços
        result = result.replace(/\s+/g, ' ').trim();

        // Junta prefixo prenex com a matriz
        if (quantifiers.length > 0) {
            result = quantifiers.join(' ') + ' (' + result + ')';
        }
        return result;
    }

    convertToPCNF(prenexFormula) {
        // extrai quantificadores e a matriz
        const parts = this.separatePrenexParts(prenexFormula);
        
        // converte a matriz para CNF
        let matrix = this.convertToCNF(parts.matrix);
        
        return parts.quantifiers ? (parts.quantifiers + ' (' + matrix + ')') : matrix;
    }

    convertToPDNF(prenexFormula) {
        // extrai quantificadores e a matriz 
        const parts = this.separatePrenexParts(prenexFormula);
        
        // converte matriz para DNF
        let matrix = this.convertToDNF(parts.matrix);
        
        return parts.quantifiers ? (parts.quantifiers + ' (' + matrix + ')') : matrix;
    }

    #stripOuterParensOnce(s) {
        s = s.trim();
        if (!s.startsWith('(') || !s.endsWith(')')) return s;
        let depth = 0;
        for (let i = 0; i < s.length; i++) {
            if (s[i] === '(') depth++;
            else if (s[i] === ')') {
                depth--;
                if (depth === 0 && i < s.length - 1) {
                    // Fecha antes do fim: não é um par externo único
                    return s;
                }
            }
        }
        // Se chegou aqui, o par externo fecha no último char
        return s.slice(1, -1).trim();
    }

    separatePrenexParts(formula) {
        const m = formula.match(/^((?:[∀∃][a-zA-Z]+\s*)+)(.*)$/);
        if (m) {
            const quantifiers = m[11].trim();
            const matrix = this.#stripOuterParensOnce(m[12].trim());
            return { quantifiers, matrix };
        }
        return { quantifiers: '', matrix: this.#stripOuterParensOnce(formula) };
    }

    convertToCNF(formula) {
        let result = formula;
        // Distribuição simples
        for (let i = 0; i < 50; i++) {
            const distributed = this.applyDistributivity(result);
            if (distributed === result) break;
            result = distributed;
        }
        return result;
    }

    convertToDNF(formula) {
        // conversao DNF
        let result = formula;
        
        // aplica distribuiçao: A ∧ (B ∨ C) vira (A ∧ B) ∨ (A ∧ C)
        while (result.includes('∧') && result.includes('∨')) {
            const distributed = this.applyDistributivityDNF(result);
            if (distributed === result) break; 
            result = distributed;
        }
        
        return result;
    }

    applyDistributivity(formula) {
        return formula.replace(
            /([^∨∧()]+)∨\(([^∧()]+)∧([^)]+)\)/g,
            '($1 ∨ $2) ∧ ($1 ∨ $3)'
        );
    }

    applyDistributivityDNF(formula) {
        return formula.replace(
            /([^∨∧()]+)∧\(([^∨()]+)∨([^)]+)\)/g,
            '($1 ∧ $2) ∨ ($1 ∧ $3)'
        );
    }

    convertToClausalForm(pcnfFormula) {
        // Remove quantificadores
        let noQuant = pcnfFormula.replace(/[∀∃][a-zA-Z]+\s*/g, '').trim();
        noQuant = this.#stripOuterParensOnce(noQuant);

        // Divide em cláusulas por ∧ (nível textual simples)
        // Limpa parênteses externos de cada cláusula uma vez
        const clauses = noQuant
            .split('∧')
            .map(c => this.#stripOuterParensOnce(c).trim())
            .filter(c => c.length > 0);

        // Monta string apenas para exibição
        const display = '{ ' + clauses.map(c => c).join(' , ') + ' }';
        return { display, clauses };
    }

    convertToHornClauses(clauses) {
        // Espera um array de cláusulas; sanitiza cada uma
        const sanitize = (c) => this.#stripOuterParensOnce(c).trim();

        const hornClauses = [];
        const nonHornClauses = [];

        clauses.forEach(clauseRaw => {
            const clause = sanitize(clauseRaw);
            if (this.isHornClause(clause)) {
                try {
                    hornClauses.push(this.formatHornClause(clause));
                } catch (e) {
                    nonHornClauses.push(clause);
                }
            } else {
                nonHornClauses.push(clause);
            }
        });

        let result = '';
        if (hornClauses.length > 0) {
            result += 'Cláusulas de Horn:\n' + hornClauses.join('\n') + '\n\n';
        }
        if (nonHornClauses.length > 0) {
            result += 'Cláusulas não-Horn:\n{ ' + nonHornClauses.join(' , ') + ' }';
        }
        if (!result) result = 'Nenhuma cláusula encontrada.';
        return result;
    }

    isHornClause(clause) {
        const literals = clause.split('∨').map(l => l.trim()).filter(Boolean);
        const positiveLiterals = literals.filter(l => !l.startsWith('¬'));
        return positiveLiterals.length <= 1;
    }

    formatHornClause(clause) {
        if (!clause || clause.trim() === '') {
            throw new Error('Cláusula vazia não é válida.');
        }
        const literals = clause.split('∨').map(l => l.trim()).filter(Boolean);
        const positiveLiterals = literals.filter(l => !l.startsWith('¬'));
        const negativeLiterals = literals.filter(l => l.startsWith('¬')).map(l => l.substring(1).trim());

        if (positiveLiterals.length > 1) {
            throw new Error('Cláusula de Horn inválida: mais de um literal positivo.');
        }
        if (positiveLiterals.length === 0) {
            return ':- ' + negativeLiterals.join(', ') + '.';
        } else if (negativeLiterals.length === 0) {
            return positiveLiterals + '.';
        } else {
            return positiveLiterals + ' :- ' + negativeLiterals.join(', ') + '.';
        }
    }



    addStep(title, formula) {
        this.steps.push({ title, formula });
    }

    displayOriginalFormula(formula) {
        const originalDiv = document.getElementById('original-formula');
        if (!originalDiv) return;
        originalDiv.innerHTML = '$$' + formula + '$$';
        if (window.MathJax?.typesetPromise) {
            window.MathJax.typesetPromise([originalDiv]);
        }
    }

    displaySteps() {
        const stepsDiv = document.getElementById('conversion-steps');
        if (!stepsDiv) return;

        let stepsHTML = '';
        this.steps.forEach((step, index) => {
            stepsHTML += `
                <div class="step">
                    <div class="step-title">${index + 1}. ${step.title}</div>
                    <div class="step-formula">$$${step.formula}$$</div>
                </div>
            `;
        });
        stepsDiv.innerHTML = stepsHTML;
        if (window.MathJax?.typesetPromise) {
            window.MathJax.typesetPromise([stepsDiv]);
        }
    }

    displayResult(elementId, result) {
        const resultDiv = document.getElementById(elementId);
        if (!resultDiv) return;

        const text = String(result);
        if (text.includes('$$')) {
            resultDiv.innerHTML = text;
        } else {
            resultDiv.innerHTML = '$$' + text + '$$';
        }
        if (window.MathJax?.typesetPromise) {
            window.MathJax.typesetPromise([resultDiv]);
        }
    }

    showLoading() {
        const elements = ['conversion-steps', 'pcnf-result', 'pdnf-result', 'clausal-result', 'horn-result'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="loading"></div> Processando...';
        });
    }

    showError(message) {
        const stepsDiv = document.getElementById('conversion-steps');
        if (stepsDiv) {
            stepsDiv.innerHTML = `<div class="error">${message}</div>`;
        }
        const resultElements = ['pcnf-result', 'pdnf-result', 'clausal-result', 'horn-result'];
        resultElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="error">Erro na conversão</div>';
        });
    }
}

// Inicialização segura após o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LogicFormulaConverter();

    const examples = [
        '\\forall x (P(x) \\rightarrow Q(x))',
        '\\exists x (P(x) \\land Q(x)) \\rightarrow \\forall y R(y)',
        '\\forall x \\exists y (P(x) \\rightarrow (Q(x,y) \\land R(y)))',
        '(A \\land B) \\rightarrow (C \\lor D)',
        '\\neg (P \\land Q) \\leftrightarrow (\\neg P \\lor \\neg Q)'
    ];
    console.log('Exemplos disponíveis:', examples);
});
