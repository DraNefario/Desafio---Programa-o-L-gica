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
            // Show loading state
            this.showLoading();
            
            // Reset steps and variables
            this.steps = [];
            this.variables.clear();
            
            // Display original formula
            this.displayOriginalFormula(input);
            
            // Parse and validate the formula
            const parsedFormula = this.parseFormula(input);
            
            // Step 1: Eliminate implications and biconditionals
            const step1 = this.eliminateImplications(parsedFormula);
            this.addStep('Eliminação de Implicações e Biimpicações', step1);
            
            // Step 2: Move negations inward (Negation Normal Form)
            const step2 = this.moveNegationsInward(step1);
            this.addStep('Forma Normal de Negação (NNF)', step2);
            
            // Step 3: Rename bound variables to avoid conflicts
            const step3 = this.renameBoundVariables(step2);
            this.addStep('Renomeação de Variáveis Ligadas', step3);
            
            // Step 4: Move quantifiers outward (Prenex Form)
            const step4 = this.moveToPrenexForm(step3);
            this.addStep('Forma Prenex', step4);
            
            // Step 5: Convert to PCNF
            const pcnf = this.convertToPCNF(step4);
            this.displayResult('pcnf-result', pcnf);
            
            // Step 6: Convert to PDNF  
            const pdnf = this.convertToPDNF(step4);
            this.displayResult('pdnf-result', pdnf);
            
            // Step 7: Skolemization and convert to clausal form
            const clausal = this.convertToClausalForm(pcnf);
            this.displayResult('clausal-result', clausal);
            
            // Step 8: Convert to Horn clauses
            const horn = this.convertToHornClauses(clausal);
            this.displayResult('horn-result', horn);
            
            // Display all steps
            this.displaySteps();
            
        } catch (error) {
            this.showError(`Erro na conversão: ${error.message}`);
        }
    }

    parseFormula(input) {
        // Simple formula parser for basic LaTeX logic syntax
        // This is a simplified parser - in a real implementation, you'd want a more robust one
        
        // Replace LaTeX symbols with internal representation
        let formula = input
            .replace(/\\forall/g, '∀')
            .replace(/\\exists/g, '∃')
            .replace(/\\rightarrow/g, '→')
            .replace(/\\leftrightarrow/g, '↔')
            .replace(/\\land/g, '∧')
            .replace(/\\lor/g, '∨')
            .replace(/\\neg/g, '¬')
            .replace(/\\lnot/g, '¬');
            
        // Extract variables (simplified)
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

    detectFormulaType(formula) {
        if (formula.includes('∀') || formula.includes('∃')) {
            return 'first-order';
        }
        return 'propositional';
    }

    eliminateImplications(parsedFormula) {
        let result = parsedFormula.processed;
        
        // A → B becomes ¬A ∨ B
        result = result.replace(/([^→]+)→([^→]+)/g, '¬($1) ∨ ($2)');
        
        // A ↔ B becomes (A → B) ∧ (B → A), then apply above rule
        result = result.replace(/([^↔]+)↔([^↔]+)/g, '(($1) → ($2)) ∧ (($2) → ($1))');
        result = result.replace(/([^→]+)→([^→]+)/g, '¬($1) ∨ ($2)');
        
        return result;
    }

    moveNegationsInward(formula) {
        let result = formula;
        
        // Apply De Morgan's laws
        // ¬(A ∧ B) becomes ¬A ∨ ¬B
        result = result.replace(/¬\(([^)]+)∧([^)]+)\)/g, '¬$1 ∨ ¬$2');
        
        // ¬(A ∨ B) becomes ¬A ∧ ¬B  
        result = result.replace(/¬\(([^)]+)∨([^)]+)\)/g, '¬$1 ∧ ¬$2');
        
        // ¬¬A becomes A
        result = result.replace(/¬¬/g, '');
        
        // ¬∀x becomes ∃x¬
        result = result.replace(/¬∀([a-zA-Z]+)/g, '∃$1¬');
        
        // ¬∃x becomes ∀x¬
        result = result.replace(/¬∃([a-zA-Z]+)/g, '∀$1¬');
        
        return result;
    }

    renameBoundVariables(formula) {
        // Simple variable renaming to avoid conflicts
        // In a full implementation, this would be more sophisticated
        let result = formula;
        let variableCounter = 1;
        
        // This is a simplified approach - real implementation would need proper scope analysis
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
        
        // This is a simplified prenex transformation
        // Real implementation would need proper quantifier extraction
        
        // Extract all quantifiers to the front
        const quantifiers = [];
        const quantifierMatches = result.match(/[∀∃][a-zA-Z]+/g) || [];
        
        quantifierMatches.forEach(q => {
            quantifiers.push(q);
            result = result.replace(q, '');
        });
        
        // Remove extra spaces and parentheses
        result = result.replace(/\s+/g, ' ').trim();
        
        // Combine quantifiers with the matrix
        if (quantifiers.length > 0) {
            result = quantifiers.join(' ') + ' (' + result + ')';
        }
        
        return result;
    }

    convertToPCNF(prenexFormula) {
        // Extract quantifiers and matrix
        const parts = this.separatePrenexParts(prenexFormula);
        
        // Convert matrix to CNF
        let matrix = this.convertToCNF(parts.matrix);
        
        return parts.quantifiers + ' (' + matrix + ')';
    }

    convertToPDNF(prenexFormula) {
        // Extract quantifiers and matrix  
        const parts = this.separatePrenexParts(prenexFormula);
        
        // Convert matrix to DNF
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
        // Simplified CNF conversion using distribution
        let result = formula;
        
        // Apply distributivity: A ∨ (B ∧ C) becomes (A ∨ B) ∧ (A ∨ C)
        // This is a simplified approach - real implementation would be more complex
        while (result.includes('∨') && result.includes('∧')) {
            const distributed = this.applyDistributivity(result);
            if (distributed === result) break; // No more changes
            result = distributed;
        }
        
        return result;
    }

    convertToDNF(formula) {
        // Simplified DNF conversion 
        let result = formula;
        
        // Apply distributivity: A ∧ (B ∨ C) becomes (A ∧ B) ∨ (A ∧ C)
        while (result.includes('∧') && result.includes('∨')) {
            const distributed = this.applyDistributivityDNF(result);
            if (distributed === result) break; // No more changes
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
        // Remove quantifiers (they become implicit universal quantification)
        let result = pcnfFormula.replace(/[∀∃][a-zA-Z]+\s*/g, '');
        
        // Remove outer parentheses
        result = result.replace(/^\(|\)$/g, '');
        
        // Split into clauses (separated by ∧)
        const clauses = result.split('∧').map(clause => clause.trim());
        
        // Format as set of clauses
        const formattedClauses = clauses.map(clause => {
            // Remove parentheses from individual clauses
            return clause.replace(/^\(|\)$/g, '').trim();
        });
        
        return '{ ' + formattedClauses.join(', ') + ' }';
    }

    convertToHornClauses(clausalForm) {
        // Extract clauses from the clausal form
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
        // Count positive literals (atoms without negation)
        const literals = clause.split('∨').map(l => l.trim());
        const positiveLiterals = literals.filter(l => !l.startsWith('¬'));
        
        return positiveLiterals.length <= 1;
    }

    formatHornClause(clause) {
        const literals = clause.split('∨').map(l => l.trim());
        const positiveLiterals = literals.filter(l => !l.startsWith('¬'));
        const negativeLiterals = literals.filter(l => l.startsWith('¬')).map(l => l.substring(1));
        
        if (positiveLiterals.length === 0) {
            // Goal clause (query)
            return ':- ' + negativeLiterals.join(', ') + '.';
        } else if (negativeLiterals.length === 0) {
            // Fact
            return positiveLiterals[0] + '.';
        } else {
            // Rule
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

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LogicFormulaConverter();
    
    // Add some example formulas for quick testing
    const examples = [
        '\\forall x (P(x) \\rightarrow Q(x))',
        '\\exists x (P(x) \\land Q(x)) \\rightarrow \\forall y R(y)',
        '\\forall x \\exists y (P(x) \\rightarrow (Q(x,y) \\land R(y)))',
        '(A \\land B) \\rightarrow (C \\lor D)',
        '\\neg (P \\land Q) \\leftrightarrow (\\neg P \\lor \\neg Q)'
    ];
    
    // You could add a dropdown or buttons for quick example selection
    console.log('Exemplos disponíveis:', examples);
});