# 📦 Painel de Estoque Omie — versão demo

Dashboard que consolida o estoque de **vários depósitos físicos** a partir da API do ERP **Omie** e cruza com a planilha de vendas para sugerir reposição.

🌐 **[Abrir a demo](https://lauramazzi.github.io/painel-estoque-demo/)** — roda direto no navegador com dados fictícios.

> Esta é uma cópia pública de um projeto feito para um cliente. Os produtos, quantidades, custos, IDs de depósito e endpoints foram substituídos por dados fictícios. O código do cliente é privado.

## Problema
O estoque ficava espalhado em três depósitos no ERP (assinaturas, loja online e B2B). Para decidir a reposição era preciso exportar relatórios, juntar tudo numa planilha e calcular giro e dias de estoque à mão.

## Solução
- **Consolidação por SKU** dos saldos de cada depósito, com mapeamento configurável depósito → canal
- **Dashboard** com valor em estoque, alertas de ruptura e saldo negativo, gráficos por categoria e por depósito
- **Upload da planilha de vendas** (CSV): o painel preenche custo e saldos, calcula média de vendas por dia, dias de estoque, classificação e sugestão de reposição, e devolve a planilha pronta para baixar
- **Conexão com a API** (login com token Bearer → endpoint de estoque) ou importação manual do JSON da Omie

## Como testar
1. Abra a [demo](https://lauramazzi.github.io/painel-estoque-demo/) — os dados fictícios carregam sozinhos (modo demo).
2. Na aba de planilha, envie o arquivo [`planilha-exemplo.csv`](planilha-exemplo.csv) deste repositório e clique em processar.
3. Baixe o CSV gerado com os cálculos preenchidos.

## Stack
JavaScript (vanilla), Chart.js, PapaParse, Lucide, API REST da Omie · deploy no GitHub Pages
