// Dados FICTÍCIOS de estoque no formato da API da Omie (apenas para demonstração)
// Depósitos: 1000000001 = BOX · 1000000002 = SHOP · 1000000003 = Mercos
const MOCK_OMIE_ESTOQUE = {
  "meta": {
    "has_data": true,
    "last_sync_at": "2026-10-01 09:00:00",
    "total_products": 24,
    "total_rows": 40
  },
  "data": [
    // Bifinhos e Snacks
    { "sku": "DEMO-001", "nome": "Bifinho sabor Carne - 50g", "localizacao": 1000000001, "qtd": 8420, "cmc": 1.35, "categoria": "Bifinhos e Snacks" },
    { "sku": "DEMO-001", "nome": "Bifinho sabor Carne - 50g", "localizacao": 1000000002, "qtd": 312, "cmc": 1.35, "categoria": "Bifinhos e Snacks" },
    { "sku": "DEMO-002", "nome": "Bifinho sabor Frango e Maçã - 50g", "localizacao": 1000000001, "qtd": 5110, "cmc": 1.42, "categoria": "Bifinhos e Snacks" },
    { "sku": "DEMO-002", "nome": "Bifinho sabor Frango e Maçã - 50g", "localizacao": 1000000002, "qtd": 18, "cmc": 1.42, "categoria": "Bifinhos e Snacks" },
    { "sku": "DEMO-003", "nome": "Sticks de Aveia e Banana - 60g", "localizacao": 1000000001, "qtd": 2950, "cmc": 1.60, "categoria": "Bifinhos e Snacks" },
    { "sku": "DEMO-003", "nome": "Sticks de Aveia e Banana - 60g", "localizacao": 1000000002, "qtd": 140, "cmc": 1.60, "categoria": "Bifinhos e Snacks" },
    { "sku": "DEMO-004", "nome": "Snack Dental Menta - 80g", "localizacao": 1000000002, "qtd": 6, "cmc": 2.10, "categoria": "Bifinhos e Snacks" },

    // Petiscos naturais e desidratados
    { "sku": "DEMO-010", "nome": "Orelha Bovina Desidratada - un", "localizacao": 1000000001, "qtd": 1200, "cmc": 3.80, "categoria": "Body Parts" },
    { "sku": "DEMO-010", "nome": "Orelha Bovina Desidratada - un", "localizacao": 1000000002, "qtd": 75, "cmc": 3.80, "categoria": "Body Parts" },
    { "sku": "DEMO-011", "nome": "Traqueia Bovina - 100g", "localizacao": 1000000002, "qtd": 22, "cmc": 4.25, "categoria": "Body Parts" },
    { "sku": "DEMO-012", "nome": "Chips de Batata-doce Desidratada - 70g", "localizacao": 1000000001, "qtd": 860, "cmc": 2.90, "categoria": "Desidratados" },
    { "sku": "DEMO-012", "nome": "Chips de Batata-doce Desidratada - 70g", "localizacao": 1000000003, "qtd": 40, "cmc": 2.90, "categoria": "Desidratados" },
    { "sku": "DEMO-013", "nome": "Petisco Natural de Peixe - 40g", "localizacao": 1000000002, "qtd": 0, "cmc": 3.15, "categoria": "Naturais" },

    // Alimentos e biscoitos
    { "sku": "DEMO-020", "nome": "Sachê Úmido Carne ao Molho - 85g", "localizacao": 1000000001, "qtd": 3400, "cmc": 1.05, "categoria": "Alimentos úmidos" },
    { "sku": "DEMO-020", "nome": "Sachê Úmido Carne ao Molho - 85g", "localizacao": 1000000002, "qtd": 210, "cmc": 1.05, "categoria": "Alimentos úmidos" },
    { "sku": "DEMO-021", "nome": "Biscoito Integral Sabor Abóbora - 200g", "localizacao": 1000000002, "qtd": 58, "cmc": 3.40, "categoria": "Biscoitos" },
    { "sku": "DEMO-022", "nome": "Areia Higiênica Biodegradável - 2kg", "localizacao": 1000000002, "qtd": 34, "cmc": 9.70, "categoria": "Areia" },
    { "sku": "DEMO-022", "nome": "Areia Higiênica Biodegradável - 2kg", "localizacao": 1000000003, "qtd": 12, "cmc": 9.70, "categoria": "Areia" },

    // Brinquedos
    { "sku": "DEMO-030", "nome": "Bolinha de Borracha Resistente - M", "localizacao": 1000000001, "qtd": 4200, "cmc": 2.30, "categoria": "Brinquedos" },
    { "sku": "DEMO-030", "nome": "Bolinha de Borracha Resistente - M", "localizacao": 1000000002, "qtd": 95, "cmc": 2.30, "categoria": "Brinquedos" },
    { "sku": "DEMO-031", "nome": "Mordedor Osso de Nylon - G", "localizacao": 1000000001, "qtd": 1730, "cmc": 4.10, "categoria": "Brinquedos" },
    { "sku": "DEMO-031", "nome": "Mordedor Osso de Nylon - G", "localizacao": 1000000002, "qtd": 9, "cmc": 4.10, "categoria": "Brinquedos" },
    { "sku": "DEMO-032", "nome": "Corda com Nós Colorida - M", "localizacao": 1000000001, "qtd": 980, "cmc": 3.55, "categoria": "Puxadores de corda" },
    { "sku": "DEMO-033", "nome": "Pelúcia Raposa com Apito - P", "localizacao": 1000000001, "qtd": 2600, "cmc": 5.20, "categoria": "Pelúcias" },
    { "sku": "DEMO-033", "nome": "Pelúcia Raposa com Apito - P", "localizacao": 1000000002, "qtd": 44, "cmc": 5.20, "categoria": "Pelúcias" },
    { "sku": "DEMO-034", "nome": "Pelúcia Polvo Crocante - M", "localizacao": 1000000002, "qtd": 3, "cmc": 6.80, "categoria": "Pelúcias" },
    { "sku": "DEMO-035", "nome": "Varinha com Penas - Gatos", "localizacao": 1000000001, "qtd": 1500, "cmc": 2.75, "categoria": "Brinquedos para gatos" },
    { "sku": "DEMO-035", "nome": "Varinha com Penas - Gatos", "localizacao": 1000000003, "qtd": -1, "cmc": 2.75, "categoria": "Brinquedos para gatos" },
    { "sku": "DEMO-036", "nome": "Ratinho de Catnip - Gatos", "localizacao": 1000000002, "qtd": 61, "cmc": 1.90, "categoria": "Brinquedos para gatos" },

    // Acessórios e dispensers
    { "sku": "DEMO-040", "nome": "Comedouro Antiderrapante Inox - M", "localizacao": 1000000002, "qtd": 27, "cmc": 11.40, "categoria": "Acessórios" },
    { "sku": "DEMO-041", "nome": "Coleira Ajustável Estampada - P", "localizacao": 1000000001, "qtd": 640, "cmc": 6.30, "categoria": "Acessórios" },
    { "sku": "DEMO-041", "nome": "Coleira Ajustável Estampada - P", "localizacao": 1000000002, "qtd": 15, "cmc": 6.30, "categoria": "Acessórios" },
    { "sku": "DEMO-042", "nome": "Bandana Pet Estampa Frutas - M", "localizacao": 1000000001, "qtd": 2100, "cmc": 1.80, "categoria": "Acessórios" },
    { "sku": "DEMO-043", "nome": "Dispenser de Saquinhos + 2 Refis", "localizacao": 1000000001, "qtd": 1320, "cmc": 3.95, "categoria": "Dispenser" },
    { "sku": "DEMO-043", "nome": "Dispenser de Saquinhos + 2 Refis", "localizacao": 1000000002, "qtd": 52, "cmc": 3.95, "categoria": "Dispenser" },
    { "sku": "DEMO-044", "nome": "Refil de Saquinhos Biodegradáveis - 4 rolos", "localizacao": 1000000002, "qtd": 0, "cmc": 2.20, "categoria": "Dispenser" },
    { "sku": "DEMO-045", "nome": "Revista do Clube - Edição 12", "localizacao": 1000000001, "qtd": 5400, "cmc": 2.95, "categoria": "Revista" },
    { "sku": "DEMO-046", "nome": "Petisco Mastigável de Frango - 100g", "localizacao": 1000000001, "qtd": 730, "cmc": 4.60, "categoria": "Petiscos" },
    { "sku": "DEMO-046", "nome": "Petisco Mastigável de Frango - 100g", "localizacao": 1000000003, "qtd": 25, "cmc": 4.60, "categoria": "Petiscos" },

    // DEMO-999 (produto com estoque TOTAL negativo, para testar alertas)
    { "sku": "DEMO-999", "nome": "Brinquedo Teste Saldo Negativo", "localizacao": 1000000002, "qtd": -3, "cmc": 4.50, "categoria": "Brinquedos" }
  ]
};
