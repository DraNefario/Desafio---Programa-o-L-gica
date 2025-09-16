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
            const clausal = this.convertToClausalForm(pcnf);
            this.displayResult('clausal-result', clausal);
            
            // passo 8: conversao para clausula de horn
            const horn = this.convertToHornClauses(clausal);
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
            .replace(/\\neg/g, '¬')
            .replace(/\\lnot/g, '¬');
            
        // extraçao de variaveis
        const varMatches = formula.match(/[a-zA-Z]\([^)]*\)/g) || [];
        varMatches.forEach(match => {
            const varName = match.split('(')[0];
            this.variables.add(varName);
        });
        
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
        
        // A → B vira ¬A ∨ B
        result = result.replace(/([^→]+)→([^→]+)/g, '¬($1) ∨ ($2)');
        
        // A ↔ B vira (A → B) ∧ (B → A), entao aplica a regra de cima
        result = result.replace(/([^↔]+)↔([^↔]+)/g, '(($1) → ($2)) ∧ (($2) → ($1))');
        result = result.replace(/([^→]+)→([^→]+)/g, '¬($1) ∨ ($2)');
        
        return result;
    }

    moveNegationsInward(formula) {
        let result = formula;
        
        // aplicaçao da lei de morgan
        // ¬(A ∧ B) vira ¬A ∨ ¬B
        result = result.replace(/¬\(([^)]+)∧([^)]+)\)/g, '¬$1 ∨ ¬$2');
        
        // ¬(A ∨ B) vira ¬A ∧ ¬B  
        result = result.replace(/¬\(([^)]+)∨([^)]+)\)/g, '¬$1 ∧ ¬$2');
        
        // ¬¬A vira A
        result = result.replace(/¬¬/g, '');
        
        // ¬∀x vira ∃x¬
        result = result.replace(/¬∀([a-zA-Z]+)/g, '∃$1¬');
        
        // ¬∃x vira ∀x¬
        result = result.replace(/¬∃([a-zA-Z]+)/g, '∀$1¬');
        
        return result;
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
                result = result.replace(new RegExp(varName, 'g'), newName);
            }
            usedNames.add(varName);
        });
        
        return result;
    }

    moveToPrenexForm(formula) {
        let result = formula;
        
        // transformaçao prenex
        
        // envia os quantificadores para frente
        const quantifiers = [];
        const quantifierMatches = result.match(/[∀∃][a-zA-Z]+/g) || [];
        
        quantifierMatches.forEach(q => {
            quantifiers.push(q);
            result = result.replace(q, '');
        });
        
        // remove espaços e parenteses sobrando
        result = result.replace(/\s+/g, ' ').trim();
        
        // combina quantificadores com a matriz
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
        
        return parts.quantifiers + ' (' + matrix + ')';
    }

    convertToPDNF(prenexFormula) {
        // extrai quantificadores e a matriz 
        const parts = this.separatePrenexParts(prenexFormula);
        
        // converte matriz para DNF
        let matrix = this.convertToDNF(parts.matrix);
        
        return parts.quantifiers + ' (' + matrix + ')';
    }

    separatePrenexParts(formula) {
        const quantifierMatch = formula.match(/^([∀∃][a-zA-Z]+\s*)+/);
        
        if (quantifierMatch) {
            const quantifiers = quantifierMatch[0].trim();
            const matrix = formula.substring(quantifierMatch[0].length).trim();
            return {
                quantifiers: quantifiers,
                matrix: matrix.replace(/^\(|\)$/g, '') // Remove outer parentheses
            };
        }
        
        return {
            quantifiers: '',
            matrix: formula
        };
    }

    convertToCNF(formula) {
        // conversao de CNF usando distribuiçao
        let result = formula;
        
        // aplica distribuiçao: A ∨ (B ∧ C) vira (A ∨ B) ∧ (A ∨ C)
        while (result.includes('∨') && result.includes('∧')) {
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
        // A ∨ (B ∧ C) → (A ∨ B) ∧ (A ∨ C)
        return formula.replace(
            /([^∨∧()]+)∨\(([^∧]+)∧([^)]+)\)/g, 
            '($1 ∨ $2) ∧ ($1 ∨ $3)'
        );
    }

    applyDistributivityDNF(formula) {
        // A ∧ (B ∨ C) → (A ∧ B) ∨ (A ∧ C)
        return formula.replace(
            /([^∨∧()]+)∧\(([^∨]+)∨([^)]+)\)/g, 
            '($1 ∧ $2) ∨ ($1 ∧ $3)'
        );
    }

    convertToClausalForm(pcnfFormula) {
        // remove quantficadores 
        let result = pcnfFormula.replace(/[∀∃][a-zA-Z]+\s*/g, '');
        
        // remove parenteses externos
        result = result.replace(/^\(|\)$/g, '');
        
        // divide em clausulas (separadas por ∧)
        const clauses = result.split('∧').map(clause => clause.trim());
        
        // formata como conjunto de clausulas
        const formattedClauses = clauses.map(clause => {
            // remove parenteses de clausulas individuais
            return clause.replace(/^\(|\)$/g, '').trim();
        });
        
        return '{ ' + formattedClauses.join(', ') + ' }';
    }

    convertToHornClauses(clausalForm) {
        // remove clausulas da forma clausal
        const clauseContent = clausalForm.replace(/[{}]/g, '');
        const clauses = clauseContent.split(',').map(c => c.trim());
        
        const hornClauses = [];
        const nonHornClauses = [];
        
        clauses.forEach(clause => {
            if (this.isHornClause(clause)) {
                hornClauses.push(this.formatHornClause(clause));
            } else {
                nonHornClauses.push(clause);
            }
        });
        
        let result = '';
        
        if (hornClauses.length > 0) {
            result += 'Cláusulas de Horn:\n' + hornClauses.join('\n') + '\n\n';
        }
        
        if (nonHornClauses.length > 0) {
            result += 'Cláusulas não-Horn:\n{ ' + nonHornClauses.join(', ') + ' }';
        }
        
        if (hornClauses.length === 0 && nonHornClauses.length === 0) {
            result = 'Nenhuma cláusula encontrada.';
        }
        
        return result;
    }

    isHornClause(clause) {
        // Contar quantas ocorrências de variáveis aparecem sem negação
        const literals = clause.split('∨').map(l => l.trim());
        const positiveLiterals = literals.filter(l => !l.startsWith('¬'));
        
        return positiveLiterals.length <= 1;
    }

    formatHornClause(clause) {
        const literals = clause.split('∨').map(l => l.trim());
        const positiveLiterals = literals.filter(l => !l.startsWith('¬'));
        const negativeLiterals = literals.filter(l => l.startsWith('¬')).map(l => l.substring(1));
        
        if (positiveLiterals.length === 0) {
            return ':- ' + negativeLiterals.join(', ') + '.';
        } else if (negativeLiterals.length === 0) {
            return positiveLiterals[0] + '.';
        } else {
            return positiveLiterals[0] + ' :- ' + negativeLiterals.join(', ') + '.';
        }
    }

    addStep(title, formula) {
        this.steps.push({ title, formula });
    }

    displayOriginalFormula(formula) {
        const originalDiv = document.getElementById('original-formula');
        originalDiv.innerHTML = '$$' + formula + '$$';
        MathJax.typesetPromise([originalDiv]);
    }

    displaySteps() {
        const stepsDiv = document.getElementById('conversion-steps');
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
        MathJax.typesetPromise([stepsDiv]);
    }

    displayResult(elementId, result) {
        const resultDiv = document.getElementById(elementId);
        if (result.includes('$$')) {
            resultDiv.innerHTML = result;
        } else {
            resultDiv.innerHTML = '$$' + result + '$$';
        }
        MathJax.typesetPromise([resultDiv]);
    }

    showLoading() {
        const elements = ['conversion-steps', 'pcnf-result', 'pdnf-result', 'clausal-result', 'horn-result'];
        elements.forEach(id => {
            document.getElementById(id).innerHTML = '<div class="loading"></div> Processando...';
        });
    }

    showError(message) {
        const stepsDiv = document.getElementById('conversion-steps');
        stepsDiv.innerHTML = `<div class="error">${message}</div>`;
        
        const resultElements = ['pcnf-result', 'pdnf-result', 'clausal-result', 'horn-result'];
        resultElements.forEach(id => {
            document.getElementById(id).innerHTML = '<div class="error">Erro na conversão</div>';
        });
    }
}

// começa a aplicaçao quando a pagina carrega
document.addEventListener('DOMContentLoaded', () => {
    new LogicFormulaConverter();
    
    // adiciona algumas formulas para teste rapido
    const examples = [
        '\\forall x (P(x) \\rightarrow Q(x))',
        '\\exists x (P(x) \\land Q(x)) \\rightarrow \\forall y R(y)',
        '\\forall x \\exists y (P(x) \\rightarrow (Q(x,y) \\land R(y)))',
        '(A \\land B) \\rightarrow (C \\lor D)',
        '\\neg (P \\land Q) \\leftrightarrow (\\neg P \\lor \\neg Q)'
    ];
    
    console.log('Exemplos disponíveis:', examples);
});
