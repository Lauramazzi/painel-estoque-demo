/* ==========================================================================
   Controle de Estado do Painel de Estoque Omie
   ========================================================================== */

const state = {
    omieStockData: null,      // Dados consolidados da Omie
    mappedLocations: {        // Mapeamento de Depósitos
        box: "1000000001",
        shop: "1000000002",
        mercos: "1000000003"
    },
    credentials: {            // Credenciais de API
        loginUrl: "https://sua-api.exemplo.com/api/login",
        estoqueUrl: "https://sua-api.exemplo.com/api/omie/estoque-json",
        email: "",
        password: ""
    },
    periodDays: 26,           // Divisor de dias para cálculo de vendas
    theme: "dark",
    currentTab: "tab-dashboard",
    
    // Filtros e Ordenação
    filters: {
        search: "",
        category: "",
        location: "",
        status: ""
    },
    sort: {
        column: "sku",
        direction: "asc"
    },
    
    // Paginação da Tabela
    pagination: {
        currentPage: 1,
        pageSize: 15
    },

    // Dados da planilha importada
    uploadedCsvData: null,
    processedCsvData: null,
    
    // Instâncias de Gráficos
    charts: {
        category: null,
        location: null,
        detail: null
    }
};

// ==========================================================================
// Inicialização da Aplicação
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Carregar configurações salvas no localStorage
    loadSettingsFromStorage();
    
    // Inicializar ícones do Lucide
    lucide.createIcons();
    
    // Configurar Navegação por Abas
    initTabs();
    
    // Configurar Alternador de Temas
    initTheme();
    
    // Configurar Dropzones de Arquivos (Drag and Drop)
    initDropzones();
    
    // Registrar Eventos dos Filtros
    initFilters();
    
    // Configurar Credenciais e Formulários
    initCredentialsForm();
    
    // Inicializar Consulta em Lote de SKUs
    initBatchQuery();
    
    // Carregar dados iniciais (Modo Demo por padrão)
    loadDemoMode();
});

// ==========================================================================
// Navegação por Abas
// ==========================================================================
function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            
            // Alterar botão ativo
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            // Alterar aba visível
            document.querySelectorAll(".tab-content").forEach(content => {
                content.classList.remove("active");
            });
            document.getElementById(targetTab).classList.add("active");
            
            state.currentTab = targetTab;
            
            // Re-renderizar gráficos ao voltar para o dashboard
            if (targetTab === "tab-dashboard") {
                updateCharts();
            }
        });
    });
}

// ==========================================================================
// Gestão de Temas (Claro / Escuro)
// ==========================================================================
function initTheme() {
    const themeBtn = document.getElementById("themeToggle");
    const htmlEl = document.documentElement;
    
    // Aplicar tema salvo
    htmlEl.setAttribute("data-theme", state.theme);
    updateThemeIcon();

    themeBtn.addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        htmlEl.setAttribute("data-theme", state.theme);
        localStorage.setItem("omie_theme", state.theme);
        updateThemeIcon();
        
        // Atualizar gráficos para combinar com as cores do tema
        updateCharts();
    });
}

function updateThemeIcon() {
    const themeBtn = document.getElementById("themeToggle");
    if (state.theme === "dark") {
        themeBtn.innerHTML = '<i data-lucide="sun"></i>';
    } else {
        themeBtn.innerHTML = '<i data-lucide="moon"></i>';
    }
    lucide.createIcons();
}

// ==========================================================================
// Persistência no LocalStorage
// ==========================================================================
function loadSettingsFromStorage() {
    const savedTheme = localStorage.getItem("omie_theme");
    if (savedTheme) state.theme = savedTheme;

    const savedCreds = localStorage.getItem("omie_creds");
    if (savedCreds) {
        try {
            state.credentials = JSON.parse(savedCreds);
        } catch(e) {}
    }

    const savedMapping = localStorage.getItem("omie_mapping");
    if (savedMapping) {
        try {
            state.mappedLocations = JSON.parse(savedMapping);
        } catch(e) {}
    }
    
    const savedPeriod = localStorage.getItem("omie_period_days");
    if (savedPeriod) {
        state.periodDays = parseInt(savedPeriod, 10) || 26;
    }
}

function saveSettingsToStorage() {
    localStorage.setItem("omie_creds", JSON.stringify(state.credentials));
    localStorage.setItem("omie_mapping", JSON.stringify(state.mappedLocations));
    localStorage.setItem("omie_period_days", state.periodDays.toString());
}

// ==========================================================================
// Modo Demonstração (Mock)
// ==========================================================================
function loadDemoMode() {
    // Usar os dados mockados importados do mockData.js
    if (typeof MOCK_OMIE_ESTOQUE !== 'undefined') {
        processStockData(MOCK_OMIE_ESTOQUE);
        updateSyncStatusIndicator("warning", "Modo Demo Ativo");
    } else {
        console.error("MOCK_OMIE_ESTOQUE não encontrado!");
    }
}

// ==========================================================================
// Processamento e Normalização dos Dados de Estoque da Omie
// ==========================================================================
function processStockData(rawJson) {
    if (!rawJson || !rawJson.data) return;
    
    state.omieStockData = rawJson;
    
    // Atualizar Indicador de Última Sincronização
    const lastSync = rawJson.meta ? rawJson.meta.last_sync_at : "Recém carregado";
    document.getElementById("kpi-sync-date").innerText = lastSync;
    
    // Mapear localizações únicas e atualizar os seletores
    populateLocationSelects();
    populateCategorySelects();
    
    // Atualizar KPIs e Tabelas
    filterAndRenderTable();
    updateCharts();
}

function populateLocationSelects() {
    const locDropdowns = document.querySelectorAll(".loc-dropdown-mapping");
    
    // Obter todas as localizações únicas do JSON
    const uniqueLocations = [...new Set(state.omieStockData.data.map(item => item.localizacao))];
    uniqueLocations.sort((a, b) => a - b);
    
    // Inserir nos seletores de mapeamento da planilha
    locDropdowns.forEach(dropdown => {
        const type = dropdown.id.split("-")[1]; // map-box -> box
        const savedVal = state.mappedLocations[type];
        
        dropdown.innerHTML = "";
        uniqueLocations.forEach(loc => {
            const option = document.createElement("option");
            option.value = loc;
            option.text = `${loc} ${loc == 1000000001 ? '(BOX)' : loc == 1000000002 ? '(SHOP)' : loc == 1000000003 ? '(Mercos)' : ''}`;
            
            // Selecionar valor correspondente
            if (String(loc) === String(savedVal)) {
                option.selected = true;
            }
            dropdown.appendChild(option);
        });
        
        // Atualizar valor no estado quando alterar
        dropdown.addEventListener("change", (e) => {
            state.mappedLocations[type] = e.target.value;
            saveSettingsToStorage();
        });
    });
}

function populateCategorySelects() {
    const filterCat = document.getElementById("filter-category");
    
    // Obter categorias únicas
    const uniqueCats = [...new Set(state.omieStockData.data.map(item => item.categoria).filter(Boolean))];
    uniqueCats.sort();
    
    filterCat.innerHTML = '<option value="">Todas as Categorias</option>';
    uniqueCats.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.text = cat;
        filterCat.appendChild(option);
    });
}

// ==========================================================================
// Lógica de Filtragem, Ordenação e Paginação (Tabela Dashboard)
// ==========================================================================
function initFilters() {
    const searchInput = document.getElementById("search-input");
    const categorySelect = document.getElementById("filter-category");
    const locationSelect = document.getElementById("filter-location");
    const statusSelect = document.getElementById("filter-status");
    const btnClear = document.getElementById("btn-clear-filters");
    const btnExport = document.getElementById("btn-export-csv");
    
    // Eventos de Filtro
    searchInput.addEventListener("input", (e) => {
        state.filters.search = e.target.value.toLowerCase();
        state.pagination.currentPage = 1;
        filterAndRenderTable();
    });
    
    categorySelect.addEventListener("change", (e) => {
        state.filters.category = e.target.value;
        state.pagination.currentPage = 1;
        filterAndRenderTable();
    });
    
    locationSelect.addEventListener("change", (e) => {
        state.filters.location = e.target.value;
        state.pagination.currentPage = 1;
        filterAndRenderTable();
    });
    
    statusSelect.addEventListener("change", (e) => {
        state.filters.status = e.target.value;
        state.pagination.currentPage = 1;
        filterAndRenderTable();
    });
    
    btnClear.addEventListener("click", () => {
        searchInput.value = "";
        categorySelect.value = "";
        locationSelect.value = "";
        statusSelect.value = "";
        state.filters = { search: "", category: "", location: "", status: "" };
        state.pagination.currentPage = 1;
        filterAndRenderTable();
    });
    
    btnExport.addEventListener("click", () => {
        exportDashboardToCSV();
    });
    
    // Evento de alteração de tamanho de página
    const pageSizeSelect = document.getElementById("page-size-select");
    pageSizeSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "all") {
            state.pagination.pageSize = 999999; // Praticamente todos
        } else {
            state.pagination.pageSize = parseInt(val, 10);
        }
        state.pagination.currentPage = 1;
        filterAndRenderTable();
    });
    
    // Eventos de Paginação
    document.getElementById("btn-prev-page").addEventListener("click", () => {
        if (state.pagination.currentPage > 1) {
            state.pagination.currentPage--;
            filterAndRenderTable();
        }
    });
    
    document.getElementById("btn-next-page").addEventListener("click", () => {
        const totalItems = getFilteredProducts().length;
        const totalPages = Math.ceil(totalItems / state.pagination.pageSize);
        if (state.pagination.currentPage < totalPages) {
            state.pagination.currentPage++;
            filterAndRenderTable();
        }
    });
    
    // Eventos de Ordenação na Tabela
    document.querySelectorAll(".data-table th[data-sort]").forEach(th => {
        th.addEventListener("click", () => {
            const col = th.getAttribute("data-sort");
            if (state.sort.column === col) {
                state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
            } else {
                state.sort.column = col;
                state.sort.direction = "asc";
            }
            
            // Atualizar ícones visualmente
            document.querySelectorAll(".data-table th .sort-icon").forEach(icon => {
                icon.setAttribute("data-lucide", "chevrons-up-down");
            });
            
            const currentIcon = th.querySelector(".sort-icon");
            if (state.sort.direction === "asc") {
                currentIcon.setAttribute("data-lucide", "chevron-up");
            } else {
                currentIcon.setAttribute("data-lucide", "chevron-down");
            }
            lucide.createIcons();
            
            filterAndRenderTable();
        });
    });
}

// Retorna uma lista de SKUs consolidados a partir do array flat da Omie
function getConsolidatedProducts() {
    if (!state.omieStockData || !state.omieStockData.data) return [];
    
    const prodMap = new Map();
    
    state.omieStockData.data.forEach(item => {
        const sku = item.sku;
        if (!prodMap.has(sku)) {
            prodMap.set(sku, {
                sku: sku,
                nome: item.nome,
                categoria: item.categoria || "NÃO CATEGORIZADO",
                cmc: parseFloat(item.cmc) || 0,
                qtd: 0,
                localizacoes: []
            });
        }
        
        const prod = prodMap.get(sku);
        const qtd = parseFloat(item.qtd) || 0;
        prod.qtd += qtd;
        prod.localizacoes.push({
            id: item.localizacao,
            qtd: qtd
        });
    });
    
    return Array.from(prodMap.values());
}

// Filtra a lista consolidada conforme os inputs
function getFilteredProducts() {
    let list = getConsolidatedProducts();
    
    // 1. Filtro de busca textual
    if (state.filters.search) {
        list = list.filter(p => 
            p.sku.toLowerCase().includes(state.filters.search) ||
            p.nome.toLowerCase().includes(state.filters.search) ||
            p.categoria.toLowerCase().includes(state.filters.search)
        );
    }
    
    // 2. Filtro de categoria
    if (state.filters.category) {
        list = list.filter(p => p.categoria === state.filters.category);
    }
    
    // 3. Filtro de localização (BOX, SHOP, B2B)
    if (state.filters.location) {
        const targetLocId = parseInt(state.mappedLocations[state.filters.location], 10);
        list = list.filter(p => p.localizacoes.some(l => String(l.id) === String(targetLocId) && l.qtd > 0));
    }
    
    // 4. Filtro de status
    if (state.filters.status) {
        if (state.filters.status === "in-stock") {
            list = list.filter(p => p.qtd > 0);
        } else if (state.filters.status === "out-of-stock") {
            list = list.filter(p => p.qtd === 0);
        } else if (state.filters.status === "negative") {
            list = list.filter(p => p.qtd < 0);
        } else if (state.filters.status === "high-cost") {
            list = list.filter(p => p.cmc > 10);
        }
    }
    
    // 5. Ordenação
    list.sort((a, b) => {
        let valA = a[state.sort.column];
        let valB = b[state.sort.column];
        
        // Calcular valores individuais de canais para ordenação
        if (state.sort.column === "box") {
            valA = a.localizacoes.find(l => String(l.id) === String(state.mappedLocations.box))?.qtd || 0;
            valB = b.localizacoes.find(l => String(l.id) === String(state.mappedLocations.box))?.qtd || 0;
        } else if (state.sort.column === "shop") {
            valA = a.localizacoes.find(l => String(l.id) === String(state.mappedLocations.shop))?.qtd || 0;
            valB = b.localizacoes.find(l => String(l.id) === String(state.mappedLocations.shop))?.qtd || 0;
        } else if (state.sort.column === "mercos") {
            valA = a.localizacoes.find(l => String(l.id) === String(state.mappedLocations.mercos))?.qtd || 0;
            valB = b.localizacoes.find(l => String(l.id) === String(state.mappedLocations.mercos))?.qtd || 0;
        } else if (state.sort.column === "valor") {
            valA = a.qtd * a.cmc;
            valB = b.qtd * b.cmc;
        }
        
        if (typeof valA === "string") {
            return state.sort.direction === "asc" 
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        } else {
            return state.sort.direction === "asc"
                ? valA - valB
                : valB - valA;
        }
    });
    
    return list;
}

// Renderiza a tabela do Dashboard
function filterAndRenderTable() {
    const tableBody = document.getElementById("table-body");
    if (!state.omieStockData) {
        tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;">Carregando dados de estoque...</td></tr>';
        return;
    }
    
    const filteredList = getFilteredProducts();
    const totalItems = filteredList.length;
    
    // Atualizar KPIs com base nos dados filtrados
    updateDashboardKpis(filteredList);
    
    // Paginação
    const startIdx = (state.pagination.currentPage - 1) * state.pagination.pageSize;
    const endIdx = Math.min(startIdx + state.pagination.pageSize, totalItems);
    const paginatedList = filteredList.slice(startIdx, endIdx);
    
    // Atualizar UI de Paginação
    document.getElementById("pagination-info").innerText = totalItems > 0 
        ? `Mostrando ${startIdx + 1}-${endIdx} de ${totalItems} produtos`
        : "Mostrando 0-0 de 0 produtos";
        
    const totalPages = Math.ceil(totalItems / state.pagination.pageSize);
    document.getElementById("page-num").innerText = state.pagination.currentPage;
    document.getElementById("btn-prev-page").disabled = state.pagination.currentPage === 1;
    document.getElementById("btn-next-page").disabled = state.pagination.currentPage >= totalPages || totalPages === 0;
    
    // Renderizar linhas
    if (paginatedList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;">Nenhum produto atende aos filtros aplicados.</td></tr>';
        return;
    }
    
    tableBody.innerHTML = "";
    paginatedList.forEach(p => {
        const rowVal = p.qtd * p.cmc;
        const tr = document.createElement("tr");
        
        // Obter estoques individuais
        const boxStock = p.localizacoes.find(l => String(l.id) === String(state.mappedLocations.box))?.qtd || 0;
        const shopStock = p.localizacoes.find(l => String(l.id) === String(state.mappedLocations.shop))?.qtd || 0;
        const mercosStock = p.localizacoes.find(l => String(l.id) === String(state.mappedLocations.mercos))?.qtd || 0;
        
        tr.innerHTML = `
            <td><strong>${p.sku}</strong></td>
            <td><div class="prod-nome" title="${p.nome}">${p.nome}</div></td>
            <td><span class="tag tag-default">${p.categoria}</span></td>
            <td>${formatPtBrNumber(boxStock)}</td>
            <td>${formatPtBrNumber(shopStock)}</td>
            <td>${formatPtBrNumber(mercosStock)}</td>
            <td><span class="${p.qtd === 0 ? 'danger-text font-bold' : ''}">${formatPtBrNumber(p.qtd)}</span></td>
            <td>${formatPtBrCurrency(p.cmc)}</td>
            <td><strong>${formatPtBrCurrency(rowVal)}</strong></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openProductDetail('${p.sku}')">
                    <i data-lucide="eye" style="width:14px;height:14px;"></i> Detalhes
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    lucide.createIcons();
}

function updateDashboardKpis(list) {
    let totalValue = 0;
    let totalItems = 0;
    
    list.forEach(p => {
        totalItems += p.qtd;
        totalValue += (p.qtd * p.cmc);
    });
    
    document.getElementById("kpi-total-value").innerText = formatPtBrCurrency(totalValue);
    document.getElementById("kpi-total-items").innerText = formatPtBrNumber(totalItems);
    document.getElementById("kpi-total-skus").innerText = formatPtBrNumber(list.length);
}

// ==========================================================================
// Gráficos (Dashboard Geral)
// ==========================================================================
function updateCharts() {
    if (!state.omieStockData) return;
    
    const filteredProducts = getFilteredProducts();
    
    // 1. Gráfico de Categorias (Top 7 Categorias por Quantidade)
    const categoryData = {};
    filteredProducts.forEach(p => {
        categoryData[p.categoria] = (categoryData[p.categoria] || 0) + p.qtd;
    });
    
    const sortedCategories = Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1]);
        
    const topCategories = sortedCategories.slice(0, 6);
    const otherCategoriesSum = sortedCategories.slice(6).reduce((sum, item) => sum + item[1], 0);
    
    const categoryLabels = topCategories.map(item => item[0]);
    const categoryValues = topCategories.map(item => item[1]);
    
    if (otherCategoriesSum > 0) {
        categoryLabels.push("Outros");
        categoryValues.push(otherCategoriesSum);
    }
    
    renderCategoryChart(categoryLabels, categoryValues);
    
    // 2. Gráfico de Localização (Saldos Consolidados por Depósito)
    const locationData = {};
    state.omieStockData.data.forEach(item => {
        // Se houver filtro de categoria ativo, filtrar no gráfico de depósitos também
        if (state.filters.category && item.categoria !== state.filters.category) return;
        
        const locName = getLocName(item.localizacao);
        locationData[locName] = (locationData[locName] || 0) + (parseFloat(item.qtd) || 0);
    });
    
    const locationLabels = Object.keys(locationData);
    const locationValues = Object.values(locationData);
    
    renderLocationChart(locationLabels, locationValues);
}

function getLocName(locId) {
    if (String(locId) === String(state.mappedLocations.box)) return `BOX (${locId})`;
    if (String(locId) === String(state.mappedLocations.shop)) return `SHOP (${locId})`;
    if (String(locId) === String(state.mappedLocations.mercos)) return `Mercos/B2B (${locId})`;
    return `Depósito ${locId}`;
}

function renderCategoryChart(labels, values) {
    const ctx = document.getElementById("categoryChart").getContext("2d");
    
    if (state.charts.category) {
        state.charts.category.destroy();
    }
    
    const themeColors = state.theme === "dark" 
        ? ["#0082A0", "#8B5CF6", "#3B82F6", "#F59E0B", "#10B981", "#EC4899", "#6B7280"]
        : ["#0082A0", "#7C3AED", "#2563EB", "#D97706", "#059669", "#DB2777", "#9CA3AF"];
        
    state.charts.category = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: themeColors,
                borderWidth: state.theme === "dark" ? 2 : 1,
                borderColor: state.theme === "dark" ? "#15222E" : "#FFFFFF"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        color: state.theme === "dark" ? "#F3F4F6" : "#1F2937",
                        font: { family: "Nunito", size: 12 }
                    }
                }
            }
        }
    });
}

function renderLocationChart(labels, values) {
    const ctx = document.getElementById("locationChart").getContext("2d");
    
    if (state.charts.location) {
        state.charts.location.destroy();
    }
    
    state.charts.location = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Estoque Físico",
                data: values,
                backgroundColor: "rgba(0, 130, 160, 0.7)",
                borderColor: "#0082A0",
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: state.theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
                    ticks: { color: state.theme === "dark" ? "#9CA3AF" : "#6B7280" }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: state.theme === "dark" ? "#F3F4F6" : "#1F2937" }
                }
            }
        }
    });
}

// Gráfico de distribuição interna do produto detalhado
function renderDetailChart(labels, values) {
    const ctx = document.getElementById("detailChart").getContext("2d");
    
    if (state.charts.detail) {
        state.charts.detail.destroy();
    }
    
    state.charts.detail = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ["#0082A0", "#8B5CF6", "#3B82F6", "#F59E0B", "#6B7280"],
                borderWidth: 2,
                borderColor: state.theme === "dark" ? "#15222E" : "#FFFFFF"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: state.theme === "dark" ? "#F3F4F6" : "#1F2937",
                        font: { family: "Nunito", size: 11 }
                    }
                }
            }
        }
    });
}

// ==========================================================================
// Slide-over Drawer (Detalhes Individuais do Produto)
// ==========================================================================
function openProductDetail(sku) {
    const prod = getConsolidatedProducts().find(p => p.sku === sku);
    if (!prod) return;
    
    // Alimentar textos no drawer
    document.getElementById("detail-product-name").innerText = prod.nome;
    document.getElementById("detail-sku").innerText = prod.sku;
    document.getElementById("detail-category").innerText = prod.categoria;
    document.getElementById("detail-cmc").innerText = formatPtBrCurrency(prod.cmc);
    
    const totalValue = prod.qtd * prod.cmc;
    document.getElementById("detail-total-value").innerText = formatPtBrCurrency(totalValue);
    document.getElementById("detail-total-qty").innerText = formatPtBrNumber(prod.qtd);
    
    // Listar localizações
    const tbody = document.getElementById("detail-locations-list");
    tbody.innerHTML = "";
    
    const chartLabels = [];
    const chartValues = [];
    
    prod.localizacoes.forEach(loc => {
        const tr = document.createElement("tr");
        const name = getLocName(loc.id);
        
        tr.innerHTML = `
            <td><code>${loc.id}</code></td>
            <td><strong>${name}</strong></td>
            <td style="text-align: right;">${formatPtBrNumber(loc.qtd)}</td>
        `;
        tbody.appendChild(tr);
        
        if (loc.qtd > 0) {
            chartLabels.push(name.split(" ")[0]); // "BOX" em vez de "BOX (1000000001)"
            chartValues.push(loc.qtd);
        }
    });
    
    // Se o produto estiver totalmente zerado, exibir aviso
    if (prod.qtd === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:16px;color:var(--danger-red);">Sem estoque disponível em nenhuma localização.</td></tr>';
    }
    
    // Renderizar gráfico de distribuição do produto
    renderDetailChart(chartLabels.length ? chartLabels : ["Sem Estoque"], chartValues.length ? chartValues : [1]);
    
    // Abrir gaveta
    const drawer = document.getElementById("detail-drawer");
    drawer.classList.add("open");
    
    // Evento de fechamento
    const closeBtn = document.getElementById("btn-close-drawer");
    const overlay = drawer.querySelector(".drawer-overlay");
    
    const closeDrawer = () => {
        drawer.classList.remove("open");
    };
    
    closeBtn.onclick = closeDrawer;
    overlay.onclick = closeDrawer;
}

// ==========================================================================
// Alimentador de Planilhas (CSV Helper & Cálculos)
// ==========================================================================
function initDropzones() {
    const csvDrop = document.getElementById("csv-dropzone");
    const csvInput = document.getElementById("csv-file-input");
    const jsonDrop = document.getElementById("json-dropzone");
    const jsonInput = document.getElementById("json-file-input");
    
    // Configurar cliques nos dropzones
    csvDrop.addEventListener("click", () => csvInput.click());
    jsonDrop.addEventListener("click", () => jsonInput.click());
    
    // Handlers de Arquivo
    csvInput.addEventListener("change", (e) => handleCsvFile(e.target.files[0]));
    jsonInput.addEventListener("change", (e) => handleJsonFile(e.target.files[0]));
    
    // Drag & Drop para CSV
    setupDragAndDrop(csvDrop, handleCsvFile);
    setupDragAndDrop(jsonDrop, handleJsonFile);
    
    // Configuração dos dias do período de vendas
    const periodInput = document.getElementById("period-days");
    periodInput.addEventListener("change", (e) => {
        const val = parseInt(e.target.value, 10);
        if (val > 0) {
            state.periodDays = val;
            saveSettingsToStorage();
        }
    });
    
    // Ação do botão de remoção
    document.getElementById("btn-remove-csv").addEventListener("click", (e) => {
        e.stopPropagation();
        state.uploadedCsvData = null;
        state.processedCsvData = null;
        document.getElementById("csv-file-info").classList.add("hidden");
        csvDrop.classList.remove("hidden");
        csvInput.value = "";
        document.getElementById("btn-process-sheet").disabled = true;
        
        // Resetar área de resultados
        document.getElementById("results-empty").classList.remove("hidden");
        document.getElementById("results-loaded").classList.add("hidden");
    });
    
    document.getElementById("btn-remove-json").addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("json-file-info").classList.add("hidden");
        jsonDrop.classList.remove("hidden");
        jsonInput.value = "";
        loadDemoMode(); // Volta pro mock
    });

    // Ação do botão Processar Planilha
    document.getElementById("btn-process-sheet").addEventListener("click", processSpreadsheet);
    
    // Ação de Download
    document.getElementById("btn-download-csv").addEventListener("click", downloadProcessedCsv);
    
    // Ação para alternar para o Modo Demo no Config
    document.getElementById("btn-toggle-demo").addEventListener("click", () => {
        loadDemoMode();
        showToast("Modo Demonstração carregado!");
    });
}

function setupDragAndDrop(element, callback) {
    ['dragenter', 'dragover'].forEach(eventName => {
        element.addEventListener(eventName, (e) => {
            e.preventDefault();
            element.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        element.addEventListener(eventName, (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
        }, false);
    });

    element.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        callback(file);
    }, false);
}

function handleCsvFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
        showToast("Tipo de arquivo inválido. Selecione um arquivo CSV.", "error");
        return;
    }
    
    // Mostrar informações do arquivo carregado
    document.getElementById("csv-filename").innerText = file.name;
    document.getElementById("csv-filesize").innerText = `${(file.size / 1024).toFixed(1)} KB`;
    document.getElementById("csv-dropzone").classList.add("hidden");
    document.getElementById("csv-file-info").classList.remove("hidden");
    
    // Usar PapaParse para ler o arquivo
    Papa.parse(file, {
        skipEmptyLines: true,
        complete: function(results) {
            state.uploadedCsvData = results.data;
            document.getElementById("btn-process-sheet").disabled = false;
            showToast("Planilha de abastecimento carregada!");
        },
        error: function(err) {
            showToast("Erro ao ler o arquivo CSV.", "error");
            console.error(err);
        }
    });
}

function handleJsonFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.json')) {
        showToast("Tipo de arquivo inválido. Selecione um arquivo JSON da Omie.", "error");
        return;
    }
    
    document.getElementById("json-filename").innerText = file.name;
    document.getElementById("json-filesize").innerText = `${(file.size / 1024).toFixed(1)} KB`;
    document.getElementById("json-dropzone").classList.add("hidden");
    document.getElementById("json-file-info").classList.remove("hidden");
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const rawJson = JSON.parse(e.target.result);
            if (rawJson && rawJson.data) {
                processStockData(rawJson);
                updateSyncStatusIndicator("success", "JSON Local Carregado");
                showToast("Arquivo JSON de estoque carregado com sucesso!");
            } else {
                showToast("Estrutura do JSON inválida. Deve conter um campo 'data'.", "error");
            }
        } catch(err) {
            showToast("Erro ao processar JSON. Certifique-se de que é um JSON válido.", "error");
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// Processa a Planilha carregada mesclando os saldos da Omie
function processSpreadsheet() {
    if (!state.uploadedCsvData || !state.omieStockData) {
        showToast("Certifique-se de carregar a planilha e o estoque da Omie.", "error");
        return;
    }
    
    const rawRows = state.uploadedCsvData;
    if (rawRows.length === 0) return;
    
    // Identificar a linha de cabeçalho (normalmente a primeira)
    const headers = rawRows[0].map(h => h.toString().trim());
    
    // Localizar índices das colunas de interesse
    const indexes = findHeaderIndexes(headers);
    
    if (indexes.sku === -1) {
        showToast("Coluna 'SKU' não encontrada na planilha. Impossível vincular produtos.", "error");
        return;
    }
    
    // Criar mapa de estoque Omie por SKU
    const omieMap = new Map();
    state.omieStockData.data.forEach(item => {
        const sku = item.sku;
        if (!omieMap.has(sku)) {
            omieMap.set(sku, {
                custo: parseFloat(item.cmc) || 0,
                categoria: item.categoria,
                nome: item.nome,
                stocks: {} // localizacao -> qtd
            });
        }
        const prod = omieMap.get(sku);
        prod.stocks[item.localizacao] = parseFloat(item.qtd) || 0;
    });
    
    // Processar registros da planilha
    const processedRows = [headers]; // Inicia com os mesmos cabeçalhos
    const previewData = [];
    let updatedCount = 0;
    let missingCount = 0;
    let totalStockSum = 0;
    
    for (let i = 1; i < rawRows.length; i++) {
        const originalRow = [...rawRows[i]];
        
        // Garante que o tamanho da linha corresponda ao cabeçalho para evitar desalinhar
        while (originalRow.length < headers.length) {
            originalRow.push("");
        }
        
        const sku = originalRow[indexes.sku] ? originalRow[indexes.sku].toString().trim() : "";
        if (!sku) {
            processedRows.push(originalRow); // Mantém linha em branco ou sem SKU
            continue;
        }
        
        const omieProd = omieMap.get(sku);
        
        if (omieProd) {
            updatedCount++;
            
            // Resgatar estoques específicos usando as localizações configuradas
            const boxStock = omieProd.stocks[state.mappedLocations.box] || 0;
            const shopStock = omieProd.stocks[state.mappedLocations.shop] || 0;
            const mercosStock = omieProd.stocks[state.mappedLocations.mercos] || 0;
            
            // Calcular estoque total (soma de todas as localizações disponíveis na Omie para este SKU)
            const totalStock = Object.values(omieProd.stocks).reduce((sum, val) => sum + val, 0);
            totalStockSum += totalStock;
            
            // Salvar valores antigos para exibição na comparação do preview
            const oldBox = indexes.box !== -1 ? originalRow[indexes.box] : "0";
            const oldShop = indexes.shop !== -1 ? originalRow[indexes.shop] : "0";
            const oldMercos = indexes.mercos !== -1 ? originalRow[indexes.mercos] : "0";
            const oldTotal = indexes.total !== -1 ? originalRow[indexes.total] : "0";
            
            // 1. Atualizar campos básicos
            if (indexes.custo !== -1) originalRow[indexes.custo] = formatPtBrDecimal(omieProd.custo);
            if (indexes.total !== -1) originalRow[indexes.total] = totalStock.toString();
            if (indexes.box !== -1) originalRow[indexes.box] = boxStock.toString();
            if (indexes.shop !== -1) originalRow[indexes.shop] = shopStock.toString();
            if (indexes.mercos !== -1) originalRow[indexes.mercos] = mercosStock.toString();
            
            // 2. Recalcular Fórmulas do SHOP
            if (indexes.vendasShop !== -1) {
                const vendasShop = parsePtBrFloat(originalRow[indexes.vendasShop]);
                const mediaDiaShop = vendasShop / state.periodDays;
                
                if (indexes.mediaVendasShop !== -1) {
                    originalRow[indexes.mediaVendasShop] = formatPtBrDecimal(mediaDiaShop, 1);
                }
                
                let diasEstoqueShop = 0;
                if (mediaDiaShop > 0) {
                    diasEstoqueShop = shopStock / mediaDiaShop;
                }
                
                if (indexes.diasEstoqueShop !== -1) {
                    originalRow[indexes.diasEstoqueShop] = formatPtBrDecimal(diasEstoqueShop, 1);
                }
                
                // Calcular Classificação e Sugestão
                let classificacao = "OK";
                let sugestao = "Não requer ação";
                
                if (vendasShop === 0) {
                    classificacao = "Sem vendas no período";
                    sugestao = boxStock > 0 ? "Repor com estoque do BOX" : "Sem estoque disponível";
                } else if (diasEstoqueShop < 8) {
                    classificacao = "Urgente";
                    sugestao = boxStock > 0 ? "Repor com estoque do BOX" : (mercosStock > 0 ? "Repor com estoque B2B" : "Sem estoque disponível");
                } else if (diasEstoqueShop < 15) {
                    classificacao = "Alerta Vermelho";
                    sugestao = boxStock > 0 ? "Repor com estoque do BOX" : (mercosStock > 0 ? "Repor com estoque B2B" : "Sem estoque disponível");
                } else if (diasEstoqueShop < 25) {
                    classificacao = "Alerta Amarelo";
                    sugestao = boxStock > 0 ? "Repor com estoque do BOX" : (mercosStock > 0 ? "Repor com estoque B2B" : "Sem estoque disponível");
                }
                
                if (indexes.classificacaoShop !== -1) originalRow[indexes.classificacaoShop] = classificacao;
                if (indexes.sugestaoShop !== -1) originalRow[indexes.sugestaoShop] = sugestao;
            }
            
            // 3. Recalcular Fórmulas do BOX (Campanhas)
            if (indexes.totalCampanhaBox !== -1) {
                const totalCampanhaBox = parsePtBrFloat(originalRow[indexes.totalCampanhaBox]) || 0;
                const mediaDiaBox = totalCampanhaBox / state.periodDays;
                
                if (indexes.mediaDiaBox !== -1) {
                    originalRow[indexes.mediaDiaBox] = formatPtBrDecimal(mediaDiaBox, 1);
                }
                
                let diasEstoqueBox = 0;
                if (mediaDiaBox > 0) {
                    diasEstoqueBox = boxStock / mediaDiaBox;
                }
                
                if (indexes.diasEstoqueBox !== -1) {
                    originalRow[indexes.diasEstoqueBox] = formatPtBrDecimal(diasEstoqueBox, 1);
                }
                
                // Calcular Situação BOX
                let situacaoBox = "OK";
                if (totalCampanhaBox === 0) {
                    situacaoBox = "Sem Campanha / Fora de Campanha";
                } else if (diasEstoqueBox < 10) {
                    situacaoBox = "Urgente / Reposição imediata";
                } else if (diasEstoqueBox < 20) {
                    situacaoBox = "Alerta Amarelo";
                }
                
                if (indexes.situacaoBox !== -1) {
                    originalRow[indexes.situacaoBox] = situacaoBox;
                }
            }

            // 4. Recalcular Sugestão B2B
            if (indexes.sugestaoB2b !== -1) {
                let sugestaoB2b = "Não requer ação";
                if (mercosStock < 20) {
                    if (boxStock > 100) {
                        sugestaoB2b = "Repor com estoque do BOX";
                    } else {
                        sugestaoB2b = "Solicitar Compra / Produção";
                    }
                }
                originalRow[indexes.sugestaoB2b] = sugestaoB2b;
            }
            
            // Adicionar ao Preview (máximo 12 registros de visualização rápida)
            if (previewData.length < 12) {
                previewData.push({
                    sku: sku,
                    nome: omieProd.nome || originalRow[indexes.nome] || "Produto Desconhecido",
                    box: `${oldBox} → ${boxStock}`,
                    shop: `${oldShop} → ${shopStock}`,
                    mercos: `${oldMercos} → ${mercosStock}`,
                    total: `${oldTotal} → ${totalStock}`
                });
            }
        } else {
            missingCount++;
            // Se o SKU não existe na sincronização da Omie, zera os estoques na planilha
            if (indexes.total !== -1) originalRow[indexes.total] = "0";
            if (indexes.box !== -1) originalRow[indexes.box] = "0";
            if (indexes.shop !== -1) originalRow[indexes.shop] = "0";
            if (indexes.mercos !== -1) originalRow[indexes.mercos] = "0";
        }
        
        processedRows.push(originalRow);
    }
    
    state.processedCsvData = processedRows;
    
    // Atualizar UI com os resultados
    document.getElementById("res-updated-count").innerText = updatedCount;
    document.getElementById("res-missing-count").innerText = missingCount;
    document.getElementById("res-total-stock").innerText = formatPtBrNumber(totalStockSum);
    
    // Desenhar tabela de preview
    const previewBody = document.getElementById("preview-sheet-body");
    previewBody.innerHTML = "";
    previewData.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.sku}</strong></td>
            <td><div class="prod-nome" style="max-width: 180px;">${item.nome}</div></td>
            <td>${item.box}</td>
            <td>${item.shop}</td>
            <td>${item.mercos}</td>
            <td><strong>${item.total}</strong></td>
        `;
        previewBody.appendChild(tr);
    });
    
    // Trocar visibilidade do card de resultados
    document.getElementById("results-empty").classList.add("hidden");
    document.getElementById("results-loaded").classList.remove("hidden");
    
    showToast("Planilha de abastecimento alimentada com sucesso!");
}

// Procura os cabeçalhos correspondentes de forma inteligente
function findHeaderIndexes(headers) {
    const indexes = {
        sku: -1, nome: -1, categoria: -1, custo: -1, total: -1,
        box: -1, shop: -1, mercos: -1,
        vendasShop: -1, mediaVendasShop: -1, diasEstoqueShop: -1,
        classificacaoShop: -1, sugestaoShop: -1,
        totalCampanhaBox: -1, mediaDiaBox: -1, diasEstoqueBox: -1,
        situacaoBox: -1, sugestaoB2b: -1
    };
    
    headers.forEach((h, idx) => {
        const text = h.toLowerCase().trim().replace(/[\s_\-]/g, '');
        
        if (text === "sku") indexes.sku = idx;
        else if (text === "nome" || text === "produto" || text === "descrição") indexes.nome = idx;
        else if (text === "categoria") indexes.categoria = idx;
        else if (text === "custo" || text === "cmc") indexes.custo = idx;
        else if (text === "estoquetotal" || text === "totalestoque") indexes.total = idx;
        else if (text === "estoquebox" || text === "box") indexes.box = idx;
        else if (text === "estoqueshop" || text === "shop") indexes.shop = idx;
        else if (text === "estoquemercos" || text === "mercos" || text === "estoqueb2b") indexes.mercos = idx;
        else if (text === "vendasshopperiodo" || text === "vendasperiodoshop") indexes.vendasShop = idx;
        else if (text === "mediavendasdiashop" || text === "mediavendasdia" || text === "mediadiashop") indexes.mediaVendasShop = idx;
        else if (text === "diasestoqueshop" || text === "diasestoque") indexes.diasEstoqueShop = idx;
        else if (text === "classificacaoshop" || text === "classificaçãoshop") indexes.classificacaoShop = idx;
        else if (text === "sugestaoshop" || text === "sugestãoshop") indexes.sugestaoShop = idx;
        else if (text === "totalcampanhabox" || text === "totalcampanha") indexes.totalCampanhaBox = idx;
        else if (text === "mediadiabox" || text === "mediabox") indexes.mediaDiaBox = idx;
        else if (text === "diasestoquebox" || text === "diasbox") indexes.diasEstoqueBox = idx;
        else if (text === "situacaobox" || text === "situaçãobox") indexes.situacaoBox = idx;
        else if (text === "sugestaob2b" || text === "sugestãob2b") indexes.sugestaoB2b = idx;
    });
    
    return indexes;
}

// Download do CSV de resultados atualizados
function downloadProcessedCsv() {
    if (!state.processedCsvData) return;
    
    // Gerar string CSV formatada para o Excel brasileiro (delimitador ; e UTF-8 com BOM)
    const csvContent = Papa.unparse(state.processedCsvData, {
        delimiter: ";"
    });
    
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const dataString = new Date().toISOString().slice(0,10);
    link.setAttribute("href", url);
    link.setAttribute("download", `planilha_abastecimento_alimentada_${dataString}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Download da planilha iniciado!");
}

// ==========================================================================
// Integração Dinâmica da API (Auth & Fetch)
// ==========================================================================
function initCredentialsForm() {
    const form = document.getElementById("api-config-form");
    const loginInput = document.getElementById("endpoint-login");
    const estoqueInput = document.getElementById("endpoint-estoque");
    const emailInput = document.getElementById("api-email");
    const passwordInput = document.getElementById("api-password");
    const btnConnect = document.getElementById("btn-connect-api");
    
    // Popular campos com credenciais salvas
    loginInput.value = state.credentials.loginUrl;
    estoqueInput.value = state.credentials.estoqueUrl;
    emailInput.value = state.credentials.email;
    passwordInput.value = state.credentials.password;
    
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        state.credentials = {
            loginUrl: loginInput.value,
            estoqueUrl: estoqueInput.value,
            email: emailInput.value,
            password: passwordInput.value
        };
        saveSettingsToStorage();
        showToast("Configurações da API salvas com sucesso!");
    });
    
    btnConnect.addEventListener("click", () => {
        // Garantir que as configurações atuais do form foram aplicadas
        state.credentials = {
            loginUrl: loginInput.value,
            estoqueUrl: estoqueInput.value,
            email: emailInput.value,
            password: passwordInput.value
        };
        saveSettingsToStorage();
        
        if (!state.credentials.email || !state.credentials.password) {
            showToast("Insira o e-mail e a senha de acesso para conectar.", "warning");
            return;
        }
        
        loginAndFetchStockData();
    });
}

function loginAndFetchStockData() {
    updateSyncStatusIndicator("syncing", "Conectando...");
    showToast("Autenticando na API...");
    
    // 1. Realizar Login
    fetch(state.credentials.loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: state.credentials.email,
            password: state.credentials.password
        })
    })
    .then(response => {
        if (!response.ok) throw new Error("Erro na autenticação. Verifique os dados.");
        return response.json();
    })
    .then(authResult => {
        if (authResult.success && authResult.success.token) {
            const token = authResult.success.token;
            showToast("Autenticado! Buscando estoque Omie...");
            fetchStockData(token);
        } else {
            throw new Error("Resposta da autenticação não possui token.");
        }
    })
    .catch(err => {
        console.error(err);
        showToast(`Erro de conexão: ${err.message}. Tente carregar o arquivo JSON localmente ou verifique problemas de CORS.`, "danger");
        updateSyncStatusIndicator("danger", "Erro de Conexão");
    });
}

function fetchStockData(token) {
    fetch(state.credentials.estoqueUrl, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) throw new Error("Erro ao consultar endpoint de estoque.");
        return response.json();
    })
    .then(stockResult => {
        // Verificar se está em processo de sincronização
        if (stockResult.message && stockResult.message.includes("sincronização")) {
            // Mostrar banner informativo e entrar em modo de polling (atualizar a cada 1 min)
            document.getElementById("syncProcessBanner").classList.remove("hidden");
            updateSyncStatusIndicator("syncing", "Sincronizando Omie...");
            showToast("A API Omie está atualizando. Exibindo dados locais ou mockados.", "warning");
            
            // Agendar novo fetch automático em 1 minuto
            setTimeout(() => {
                if (state.credentials.email && state.credentials.password) {
                    loginAndFetchStockData();
                }
            }, 60000);
        } else {
            // Sucesso! Processar os novos saldos
            document.getElementById("syncProcessBanner").classList.add("hidden");
            processStockData(stockResult);
            updateSyncStatusIndicator("success", "Sincronizado");
            showToast("Estoque Omie atualizado em tempo real!");
        }
    })
    .catch(err => {
        console.error(err);
        showToast(`Erro ao carregar estoque: ${err.message}`, "danger");
        updateSyncStatusIndicator("danger", "Erro no Estoque");
    });
}

function updateSyncStatusIndicator(type, label) {
    const indicator = document.getElementById("syncStatus");
    indicator.className = `status-indicator ${type}`;
    indicator.querySelector(".status-lbl").innerText = label;
}

// ==========================================================================
// Utilitários de Formatação e Toast notifications
// ==========================================================================
function parsePtBrFloat(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    // Remove pontos de milhares, substitui vírgula decimal por ponto
    const clean = val.toString().trim().replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
}

function formatPtBrDecimal(val, decimals = 2) {
    if (val === null || val === undefined || isNaN(val)) return '0';
    // Converte para string com decimal de vírgula brasileira
    return val.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
}

function formatPtBrCurrency(val) {
    if (val === null || val === undefined || isNaN(val)) return "R$ 0,00";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPtBrNumber(val) {
    if (val === null || val === undefined || isNaN(val)) return "0";
    return val.toLocaleString("pt-BR");
}

function showToast(message, type = "success") {
    // Tenta obter ou criar o container do toast
    let toast = document.getElementById("app-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "app-toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    
    toast.className = `toast show ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    
    // Ocultar após 4 segundos
    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

// ==========================================================================
// ABA: Consulta em Lote de SKUs
// ==========================================================================
function initBatchQuery() {
    const btnSearch = document.getElementById("btn-batch-search");
    const btnClear = document.getElementById("btn-batch-clear");
    const btnExport = document.getElementById("btn-batch-export");
    const textInput = document.getElementById("batch-skus-input");
    const resultsContainer = document.getElementById("batch-results-container");
    
    // Armazenar os resultados da consulta atual para exportação
    let currentBatchResults = [];

    btnSearch.addEventListener("click", () => {
        if (!state.omieStockData) {
            showToast("Nenhum dado de estoque carregado. Por favor, conecte à API ou ative o modo Demo.", "error");
            return;
        }

        const rawText = textInput.value;
        if (!rawText.trim()) {
            showToast("Digite pelo menos um SKU para consultar.", "warning");
            return;
        }

        // Limpar SKUs duplicados, vazios e normalizar
        const skusToSearch = [...new Set(
            rawText.split("\n")
                .map(s => s.trim())
                .filter(s => s.length > 0)
        )];

        if (skusToSearch.length === 0) {
            showToast("Nenhum SKU válido encontrado.", "warning");
            return;
        }

        // Mapear dados da Omie
        const omieMap = new Map();
        state.omieStockData.data.forEach(item => {
            const sku = item.sku;
            if (!omieMap.has(sku)) {
                omieMap.set(sku, {
                    sku: sku,
                    nome: item.nome,
                    stocks: {}
                });
            }
            const prod = omieMap.get(sku);
            prod.stocks[item.localizacao] = parseFloat(item.qtd) || 0;
        });

        // Executar cruzamento
        let foundCount = 0;
        let notFoundCount = 0;
        let totalBox = 0;
        let totalShop = 0;
        let totalMercos = 0;
        let totalQty = 0;

        const resultsList = [];
        const notFoundList = [];

        skusToSearch.forEach(sku => {
            const match = omieMap.get(sku);
            if (match) {
                foundCount++;
                const boxStock = match.stocks[state.mappedLocations.box] || 0;
                const shopStock = match.stocks[state.mappedLocations.shop] || 0;
                const mercosStock = match.stocks[state.mappedLocations.mercos] || 0;
                const totalStock = Object.values(match.stocks).reduce((sum, val) => sum + val, 0);

                totalBox += boxStock;
                totalShop += shopStock;
                totalMercos += mercosStock;
                totalQty += totalStock;

                resultsList.push({
                    sku: sku,
                    nome: match.nome,
                    box: boxStock,
                    shop: shopStock,
                    mercos: mercosStock,
                    total: totalStock
                });
            } else {
                notFoundCount++;
                notFoundList.push(sku);
            }
        });

        currentBatchResults = resultsList;

        // Atualizar KPIs na tela
        document.getElementById("kpi-batch-total").innerText = skusToSearch.length;
        document.getElementById("kpi-batch-found").innerText = foundCount;
        document.getElementById("kpi-batch-notfound").innerText = notFoundCount;
        document.getElementById("kpi-batch-box").innerText = formatPtBrNumber(totalBox);
        document.getElementById("kpi-batch-shop").innerText = formatPtBrNumber(totalShop);
        document.getElementById("kpi-batch-mercos").innerText = formatPtBrNumber(totalMercos);
        document.getElementById("kpi-batch-total-qty").innerText = formatPtBrNumber(totalQty);

        // Preencher tabela
        const tableBody = document.getElementById("batch-table-body");
        tableBody.innerHTML = "";

        if (resultsList.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Nenhum produto correspondente foi encontrado na base da Omie.</td></tr>';
        } else {
            resultsList.forEach(r => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${r.sku}</strong></td>
                    <td>${r.nome}</td>
                    <td style="text-align: right;">${formatPtBrNumber(r.box)}</td>
                    <td style="text-align: right;">${formatPtBrNumber(r.shop)}</td>
                    <td style="text-align: right;">${formatPtBrNumber(r.mercos)}</td>
                    <td style="text-align: right;"><strong>${formatPtBrNumber(r.total)}</strong></td>
                `;
                tableBody.appendChild(tr);
            });
        }

        // Exibir/Ocultar card de não encontrados
        const notFoundCard = document.getElementById("batch-notfound-card");
        const notFoundListDiv = document.getElementById("batch-notfound-list");
        if (notFoundList.length > 0) {
            notFoundCard.classList.remove("hidden");
            notFoundListDiv.innerHTML = notFoundList.map(sku => `<span style="display:inline-block; margin-right:12px; margin-bottom:4px; background:rgba(239, 68, 68, 0.15); padding:2px 8px; border-radius:4px; font-size:12px;">${sku}</span>`).join(" ");
        } else {
            notFoundCard.classList.add("hidden");
        }

        // Mostrar container de resultados
        resultsContainer.classList.remove("hidden");
        lucide.createIcons();
        showToast(`Busca concluída! ${foundCount} encontrados, ${notFoundCount} não encontrados.`);
    });

    btnClear.addEventListener("click", () => {
        textInput.value = "";
        resultsContainer.classList.add("hidden");
        currentBatchResults = [];
        showToast("Formulário limpo.");
    });

    btnExport.addEventListener("click", () => {
        if (currentBatchResults.length === 0) return;

        // Montar cabeçalhos
        let csvContent = "SKU;Nome;Estoque BOX;Estoque SHOP;Estoque B2B;Estoque Total\n";

        currentBatchResults.forEach(r => {
            csvContent += `"${r.sku}";"${r.nome.replace(/"/g, '""')}";${r.box};${r.shop};${r.mercos};${r.total}\n`;
        });

        // Download do arquivo CSV
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `consulta_lote_estoque_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Relatório CSV baixado com sucesso!");
    });
}
