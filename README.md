# Conversor de Fórmulas Lógicas - Documentação

Este projeto implementa uma aplicação web completa para conversão de fórmulas lógicas bem formadas em suas diferentes formas normais, conforme especificado no desafio.

## Funcionalidades

A aplicação converte fórmulas em LaTeX para:

1. **Forma Normal Conjuntiva Prenex (PCNF)**
2. **Forma Normal Disjuntiva Prenex (PDNF)**  
3. **Forma Cláusal**
4. **Cláusulas de Horn**

## Tecnologias Utilizadas

- **HTML5**: Estrutura da página
- **CSS3**: Estilização e design responsivo
- **JavaScript (ES6+)**: Lógica de conversão das fórmulas
- **MathJax 3**: Renderização de fórmulas matemáticas em LaTeX

## Arquivos do Projeto

### `index.html`
- Estrutura principal da aplicação
- Inclui integração com MathJax para renderização LaTeX
- Interface responsiva com seções para entrada e resultados

### `styles.css`  
- Design moderno com gradientes e animações
- Layout responsivo para diferentes dispositivos
- Estilos para exibição de fórmulas e passos da conversão
- Animações de loading e estados de erro

### `script.js`
- Classe `LogicFormulaConverter` que implementa toda a lógica
- Parser de fórmulas LaTeX básico
- Algoritmos de conversão step-by-step:
  - Eliminação de implicações (→) e biimpicações (↔)
  - Movimento de negações para dentro (Leis de De Morgan)
  - Renomeação de variáveis ligadas
  - Conversão para forma prenex
  - Conversão CNF/DNF
  - Skolemização e forma cláusal
  - Identificação de cláusulas de Horn

## Algoritmos Implementados

### 1. Eliminação de Implicações
- `A → B` se torna `¬A ∨ B`
- `A ↔ B` se torna `(A → B) ∧ (B → A)`

### 2. Forma Normal de Negação (NNF)
- Aplicação das Leis de De Morgan
- `¬(A ∧ B)` → `¬A ∨ ¬B`
- `¬(A ∨ B)` → `¬A ∧ ¬B`
- `¬¬A` → `A`

### 3. Forma Prenex
- Extração de quantificadores para o início da fórmula
- Formato: `Q₁x₁ Q₂x₂ ... Qₙxₙ (matriz)`

### 4. Conversão CNF/DNF
- Aplicação de distributividade
- CNF: Conjunção de disjunções
- DNF: Disjunção de conjunções

### 5. Forma Cláusal
- Remoção de quantificadores (quantificação universal implícita)
- Conjunto de cláusulas separadas

### 6. Cláusulas de Horn
- Identificação de cláusulas com no máximo um literal positivo
- Formatação em estilo Prolog:
  - Fatos: `P.`
  - Regras: `P :- Q, R.`
  - Consultas: `:- P, Q.`

## Como Usar

1. **Abra o arquivo `index.html` em um navegador web**

2. **Digite uma fórmula em LaTeX** no campo de texto, por exemplo:
   - `\forall x (P(x) \rightarrow Q(x))`
   - `\exists x (P(x) \land Q(x)) \rightarrow \forall y R(y)`
   - `(A \land B) \rightarrow (C \lor D)`

3. **Clique em "Converter"** para ver:
   - Fórmula original renderizada
   - Passos da conversão detalhados
   - Resultados em PCNF, PDNF, forma cláusal e cláusulas de Horn

4. **Use "Limpar"** para começar uma nova conversão

## Símbolos LaTeX Suportados

- `\forall` - Quantificador universal (∀)
- `\exists` - Quantificador existencial (∃)  
- `\rightarrow` - Implicação (→)
- `\leftrightarrow` - Biimplicação (↔)
- `\land` - Conjunção (∧)
- `\lor` - Disjunção (∨)
- `\neg` ou `\lnot` - Negação (¬)

## Exemplos de Fórmulas

### Lógica Proposicional:
```latex
(A \land B) \rightarrow (C \lor D)
\neg (P \land Q) \leftrightarrow (\neg P \lor \neg Q)
```

### Lógica de Primeira Ordem:
```latex
\forall x (P(x) \rightarrow Q(x))
\exists x (P(x) \land Q(x)) \rightarrow \forall y R(y)
\forall x \exists y (P(x) \rightarrow (Q(x,y) \land R(y)))
```

## Recursos Avançados

- **Renderização MathJax**: Fórmulas são exibidas com formatação matemática profissional
- **Conversão Step-by-Step**: Todos os passos intermediários são mostrados
- **Validação de Entrada**: Verificação básica de sintaxe
- **Interface Responsiva**: Funciona em desktop e mobile
- **Tratamento de Erros**: Mensagens informativas para entradas inválidas

## Limitações

Esta implementação é uma versão educacional/demonstrativa com algumas limitações:

1. **Parser Simplificado**: Não suporta todas as complexidades de sintaxe LaTeX
2. **Algoritmos Básicos**: Implementações simplificadas dos algoritmos de conversão
3. **Validação Limitada**: Verificação básica de sintaxe de fórmulas

## Expansões Futuras

Para uma versão de produção, considere:

1. **Parser Robusto**: Implementar um parser completo para fórmulas lógicas
2. **Algoritmos Otimizados**: Versões mais eficientes dos algoritmos de conversão
3. **Validação Completa**: Verificação semântica das fórmulas
4. **Mais Formatos**: Suporte a outros formatos de entrada/saída
5. **Histórico**: Salvar conversões anteriores
6. **Export**: Exportar resultados em diferentes formatos

## Testado com Fórmulas do Livro

A aplicação foi projetada para funcionar com todas as fórmulas disponíveis nos exercícios do livro de lógica especificado, suportando tanto lógica proposicional quanto de primeira ordem.

## Instalação

1. Faça download de todos os arquivos (`index.html`, `styles.css`, `script.js`)
2. Coloque todos os arquivos na mesma pasta
3. Abra `index.html` em qualquer navegador moderno
4. A aplicação funciona completamente offline (exceto pela CDN do MathJax)

## Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge (versões recentes)
- **JavaScript**: ES6+ 
- **MathJax**: Versão 3.x
- **Responsivo**: Desktop e mobile
