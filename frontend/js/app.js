// ============================================
// APP.JS — Application principale Alamine Fact
// Connectée à Supabase
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const navItems = document.querySelectorAll('.nav-item');
    const viewContainer = document.getElementById('view-container');
    const breadcrumb = document.getElementById('breadcrumb');

    // ==================== UTILITAIRES ====================
    function formatFCFA(amount) {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" style="width:18px"></i> ${message}`;
        document.body.appendChild(toast);
        lucide.createIcons({ nodes: [toast] });
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
    }

    function getStatusBadge(statut) {
        const colors = {
            'Payé': { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' },
            'Acompte': { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)' },
            'Impayé': { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)' },
            'Devis': { bg: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }
        };
        const s = colors[statut] || colors['Devis'];
        return `<span class="status-badge" style="padding:4px 10px; background:${s.bg}; color:${s.color}; border-radius:6px; font-size:0.8rem; font-weight:500;">${statut}</span>`;
    }

    // ==================== MODAL ====================
    function openModal(title, contentHTML, onSubmit) {
        const existing = document.getElementById('app-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'app-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content glass-panel animate-fade-in">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close icon-btn" id="modal-close-btn"><i data-lucide="x" style="width:20px"></i></button>
                </div>
                <form id="modal-form">
                    <div class="modal-body">${contentHTML}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn-cancel" id="modal-cancel-btn">Annuler</button>
                        <button type="submit" class="btn-submit">Enregistrer</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(modal);
        lucide.createIcons({ nodes: [modal] });
        setTimeout(() => modal.classList.add('show'), 10);

        const closeModal = () => { modal.classList.remove('show'); setTimeout(() => modal.remove(), 300); };
        modal.querySelector('#modal-close-btn').addEventListener('click', closeModal);
        modal.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        modal.querySelector('#modal-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            try {
                await onSubmit(data);
                closeModal();
            } catch (err) {
                showToast('Erreur: ' + err.message, 'error');
            }
        });
    }

    // ==================== RENDER VIEWS ====================
    window.appRenderView = async function(viewName, viewTitle) {
        // Update breadcrumb
        if (viewTitle) {
            breadcrumb.innerHTML = `<i data-lucide="home"></i> <span>Tableau de bord</span> <i data-lucide="chevron-right" style="width:14px"></i> <span class="current">${viewTitle}</span>`;
        } else {
            breadcrumb.innerHTML = `<i data-lucide="home"></i> <span>Tableau de bord</span>`;
        }

        // Show loading
        viewContainer.innerHTML = '<div class="loading-view"><div class="spinner"></div><p>Chargement...</p></div>';
        lucide.createIcons();

        try {
            switch (viewName) {
                case 'dashboard': await renderDashboard(); break;
                case 'clients': await renderClients(); break;
                case 'invoices': await renderFactures(); break;
                case 'prescriptions': await renderPrescriptions(); break;
                case 'agenda': await renderAgenda(); break;
                case 'stock': await renderStock(); break;
                case 'suppliers': await renderFournisseurs(); break;
                case 'sales': await renderNouvelleVente(); break;
                case 'workshop': viewContainer.innerHTML = '<div class="animate-fade-in" style="padding:2rem;"><h2 style="color:var(--text-main);">🏭 Atelier Kanban</h2><p style="color:var(--text-muted);margin-top:1rem;">Module en cours de développement — Phase 4</p></div>'; break;
                case 'reports': viewContainer.innerHTML = '<div class="animate-fade-in" style="padding:2rem;"><h2 style="color:var(--text-main);">📊 Rapports</h2><p style="color:var(--text-muted);margin-top:1rem;">Module en cours de développement</p></div>'; break;
                case 'settings': viewContainer.innerHTML = '<div class="animate-fade-in" style="padding:2rem;"><h2 style="color:var(--text-main);">⚙️ Paramètres</h2><p style="color:var(--text-muted);margin-top:1rem;">Module en cours de développement</p></div>'; break;
                default: viewContainer.innerHTML = `<div class="animate-fade-in"><h2>${viewTitle || viewName}</h2></div>`;
            }
        } catch (err) {
            console.error('Erreur vue:', err);
            viewContainer.innerHTML = `<div class="animate-fade-in" style="padding:2rem;"><h2 style="color:var(--accent-danger);">❌ Erreur de chargement</h2><p style="color:var(--text-muted);margin-top:1rem;">${err.message}</p><button class="btn-submit" onclick="window.appRenderView('${viewName}', '${viewTitle}')" style="margin-top:1rem;">Réessayer</button></div>`;
        }
        lucide.createIcons();
    };

    // ==================== DASHBOARD ====================
    async function renderDashboard() {
        const stats = await db.getDashboardStats();
        const recentFactures = await db.getFactures();

        viewContainer.innerHTML = `
        <div class="dashboard-view animate-fade-in">
            <div class="stats-grid">
                <div class="stat-card glass-panel accent-primary">
                    <div class="stat-icon"><i data-lucide="eye"></i></div>
                    <div class="stat-details">
                        <span class="stat-label">Prescriptions du jour</span>
                        <h3 class="stat-value">${stats.prescriptionsJour}</h3>
                        <span class="stat-trend">${stats.rdvsJour} RDV aujourd'hui</span>
                    </div>
                </div>
                <div class="stat-card glass-panel accent-success">
                    <div class="stat-icon"><i data-lucide="dollar-sign"></i></div>
                    <div class="stat-details">
                        <span class="stat-label">Chiffre d'affaires total</span>
                        <h3 class="stat-value">${formatFCFA(stats.totalCA)}</h3>
                        <span class="stat-trend positive">${formatFCFA(stats.totalPaye)} encaissé</span>
                    </div>
                </div>
                <div class="stat-card glass-panel accent-warning">
                    <div class="stat-icon"><i data-lucide="file-text"></i></div>
                    <div class="stat-details">
                        <span class="stat-label">Factures</span>
                        <h3 class="stat-value">${stats.nbFactures}</h3>
                        <span class="stat-trend">Total enregistrées</span>
                    </div>
                </div>
                <div class="stat-card glass-panel accent-danger">
                    <div class="stat-icon"><i data-lucide="package-minus"></i></div>
                    <div class="stat-details">
                        <span class="stat-label">Stock Faible</span>
                        <div style="font-size:0.8rem;margin-top:5px;">
                            ${stats.stockFaible.length > 0 ?
                                stats.stockFaible.slice(0, 3).map(p => `<span style="color:var(--accent-danger)">🔴 ${p.nom} (${p.quantite})</span>`).join('<br>') :
                                '<span style="color:var(--accent-success)">✅ Tout le stock est OK</span>'
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div class="charts-grid mt-4">
                <div class="glass-panel p-4" style="grid-column: span 2;">
                    <h3 class="chart-title">Dernières factures</h3>
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead><tr style="border-bottom:1px solid var(--border-glass);">
                            <th style="padding:0.75rem; color:var(--text-muted); font-size:0.85rem;">N°</th>
                            <th style="padding:0.75rem; color:var(--text-muted); font-size:0.85rem;">Client</th>
                            <th style="padding:0.75rem; color:var(--text-muted); font-size:0.85rem;">Total</th>
                            <th style="padding:0.75rem; color:var(--text-muted); font-size:0.85rem;">Statut</th>
                        </tr></thead>
                        <tbody>
                            ${(recentFactures.slice(0, 5)).map(f => `
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
                                    <td style="padding:0.75rem; font-weight:600; color:var(--accent-secondary);">${f.numero}</td>
                                    <td style="padding:0.75rem;">${f.clients ? f.clients.prenom + ' ' + f.clients.nom : '—'}</td>
                                    <td style="padding:0.75rem; font-weight:600;">${formatFCFA(f.total)}</td>
                                    <td style="padding:0.75rem;">${getStatusBadge(f.statut)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="glass-panel p-4">
                    <h3 class="chart-title">Produits par catégorie</h3>
                    <div style="height:300px; display:flex; justify-content:center;"><canvas id="productsChart"></canvas></div>
                </div>
            </div>
        </div>`;

        lucide.createIcons();
        initDashboardCharts(stats);
    }

    function initDashboardCharts(stats) {
        Chart.defaults.color = '#94A3B8';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
        Chart.defaults.font.family = 'Inter';

        const ctxProd = document.getElementById('productsChart');
        if (ctxProd) {
            new Chart(ctxProd, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(stats.produitsParCategorie),
                    datasets: [{
                        data: Object.values(stats.produitsParCategorie),
                        backgroundColor: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'],
                        borderWidth: 0, hoverOffset: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom' } } }
            });
        }
    }

    // ==================== CLIENTS ====================
    async function renderClients() {
        const clients = await db.getClients();
        viewContainer.innerHTML = `
        <div class="clients-view animate-fade-in">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div>
                    <h2 style="font-size:1.5rem; font-weight:600; color:var(--text-main);">Clients</h2>
                    <p style="color:var(--text-muted); font-size:0.9rem;">${clients.length} client(s) enregistré(s)</p>
                </div>
                <button class="btn-submit" id="btn-add-client" style="display:flex; align-items:center; gap:0.5rem;">
                    <i data-lucide="plus" style="width:18px"></i> Nouveau Client
                </button>
            </header>

            <div class="glass-panel" style="padding:1.25rem; margin-bottom:1.5rem;">
                <div class="global-search" style="width:100%; background:rgba(0,0,0,0.3); border:1px solid var(--border-glass);">
                    <i data-lucide="search"></i>
                    <input type="text" id="search-clients" placeholder="Rechercher par nom, prénom ou téléphone..." style="background:transparent; border:none; color:white; outline:none; width:100%; padding:0;">
                </div>
            </div>

            <div class="glass-panel" style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                    <thead><tr style="border-bottom:1px solid var(--border-glass);">
                        <th style="padding:1rem; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Nom Complet</th>
                        <th style="padding:1rem; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Téléphone</th>
                        <th style="padding:1rem; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Email</th>
                        <th style="padding:1rem; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Adresse</th>
                        <th style="padding:1rem; text-align:right; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Actions</th>
                    </tr></thead>
                    <tbody id="clients-tbody">
                        ${clients.map(c => clientRow(c)).join('')}
                    </tbody>
                </table>
                ${clients.length === 0 ? '<p style="padding:2rem; text-align:center; color:var(--text-muted);">Aucun client trouvé. Ajoutez votre premier client !</p>' : ''}
            </div>
        </div>`;

        lucide.createIcons();

        // Event: Ajouter client
        document.getElementById('btn-add-client').addEventListener('click', () => openClientModal());

        // Event: Recherche
        let searchTimeout;
        document.getElementById('search-clients').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const results = await db.getClients(e.target.value);
                document.getElementById('clients-tbody').innerHTML = results.map(c => clientRow(c)).join('');
                lucide.createIcons();
                attachClientActions();
            }, 300);
        });

        attachClientActions();
    }

    function clientRow(c) {
        return `<tr class="table-row" data-id="${c.id}">
            <td style="padding:1rem; font-weight:600;">${c.prenom || ''} ${c.nom}</td>
            <td style="padding:1rem; font-size:0.9rem;">${c.telephone || '—'}</td>
            <td style="padding:1rem; font-size:0.9rem; color:var(--text-muted);">${c.email || '—'}</td>
            <td style="padding:1rem; font-size:0.9rem; color:var(--text-muted);">${c.adresse || '—'}</td>
            <td style="padding:1rem; text-align:right;">
                <button class="icon-btn btn-edit-client" data-id="${c.id}" data-nom="${c.nom}" data-prenom="${c.prenom || ''}" data-telephone="${c.telephone || ''}" data-email="${c.email || ''}" data-adresse="${c.adresse || ''}" title="Modifier"><i data-lucide="edit-2" style="width:16px;"></i></button>
                <button class="icon-btn btn-delete-client" data-id="${c.id}" data-nom="${c.nom}" title="Supprimer" style="color:var(--accent-danger);"><i data-lucide="trash-2" style="width:16px;"></i></button>
            </td>
        </tr>`;
    }

    function attachClientActions() {
        document.querySelectorAll('.btn-edit-client').forEach(btn => {
            btn.addEventListener('click', () => {
                openClientModal({
                    id: btn.dataset.id,
                    nom: btn.dataset.nom,
                    prenom: btn.dataset.prenom,
                    telephone: btn.dataset.telephone,
                    email: btn.dataset.email,
                    adresse: btn.dataset.adresse
                });
            });
        });

        document.querySelectorAll('.btn-delete-client').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm(`Supprimer le client "${btn.dataset.nom}" ?`)) {
                    await db.deleteClient(btn.dataset.id);
                    showToast('Client supprimé');
                    renderClients();
                }
            });
        });
    }

    function openClientModal(client = null) {
        const isEdit = !!client;
        openModal(isEdit ? 'Modifier le client' : 'Nouveau Client', `
            <div class="form-grid">
                <div class="input-group"><label>Nom *</label><input type="text" name="nom" value="${client?.nom || ''}" required></div>
                <div class="input-group"><label>Prénom</label><input type="text" name="prenom" value="${client?.prenom || ''}"></div>
                <div class="input-group"><label>Téléphone</label><input type="text" name="telephone" value="${client?.telephone || ''}" placeholder="77 123 45 67"></div>
                <div class="input-group"><label>Email</label><input type="email" name="email" value="${client?.email || ''}"></div>
                <div class="input-group" style="grid-column: span 2;"><label>Adresse</label><input type="text" name="adresse" value="${client?.adresse || ''}"></div>
            </div>
        `, async (data) => {
            if (isEdit) {
                await db.updateClient(client.id, data);
                showToast('Client modifié avec succès');
            } else {
                await db.addClient(data);
                showToast('Client ajouté avec succès');
            }
            renderClients();
        });
    }

    // ==================== FACTURES ====================
    async function renderFactures() {
        const factures = await db.getFactures();
        viewContainer.innerHTML = `
        <div class="invoices-view animate-fade-in">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div>
                    <h2 style="font-size:1.5rem; font-weight:600; color:var(--text-main);">Factures & Devis</h2>
                    <p style="color:var(--text-muted); font-size:0.9rem;">${factures.length} document(s)</p>
                </div>
                <div style="display:flex; gap:1rem;">
                    <button class="btn-submit" id="btn-new-sale" style="display:flex; align-items:center; gap:0.5rem; background:var(--accent-secondary);">
                        <i data-lucide="plus" style="width:18px"></i> Nouvelle Vente
                    </button>
                </div>
            </header>

            <div class="glass-panel" style="padding:1.25rem; margin-bottom:1.5rem; display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
                <div class="global-search" style="flex-grow:1; min-width:300px; width:auto; background:rgba(0,0,0,0.3); border:1px solid var(--border-glass);">
                    <i data-lucide="search"></i>
                    <input type="text" id="search-factures" placeholder="Chercher par N° ou Client..." style="background:transparent; border:none; color:white; outline:none; padding:0;">
                </div>
                <select id="filter-statut" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-glass); color:var(--text-main); padding:0.6rem 1rem; border-radius:6px; outline:none;">
                    <option value="all">Tous les statuts</option>
                    <option value="Payé">Payé</option>
                    <option value="Acompte">Acompte</option>
                    <option value="Impayé">Impayé</option>
                    <option value="Devis">Devis</option>
                </select>
            </div>

            <div class="glass-panel" style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                    <thead><tr style="border-bottom:1px solid var(--border-glass);">
                        <th style="padding:1rem; color:var(--text-muted); font-weight:500; font-size:0.85rem;">N° Document</th>
                        <th style="padding:1rem; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Date</th>
                        <th style="padding:1rem; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Client</th>
                        <th style="padding:1rem; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Total</th>
                        <th style="padding:1rem; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Payé</th>
                        <th style="padding:1rem; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Statut</th>
                        <th style="padding:1rem; text-align:right; color:var(--text-muted); font-weight:500; font-size:0.85rem;">Actions</th>
                    </tr></thead>
                    <tbody id="factures-tbody">
                        ${factures.map(f => factureRow(f)).join('')}
                    </tbody>
                </table>
                ${factures.length === 0 ? '<p style="padding:2rem; text-align:center; color:var(--text-muted);">Aucune facture enregistrée.</p>' : ''}
            </div>
        </div>`;

        lucide.createIcons();

        document.getElementById('btn-new-sale').addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            document.querySelector('[data-view="sales"]').classList.add('active');
            window.appRenderView('sales', 'Nouvelle Vente');
        });

        // Filtre statut
        document.getElementById('filter-statut').addEventListener('change', async (e) => {
            const results = await db.getFactures({ statut: e.target.value });
            document.getElementById('factures-tbody').innerHTML = results.map(f => factureRow(f)).join('');
            lucide.createIcons();
            attachFactureActions();
        });

        attachFactureActions();
    }

    function factureRow(f) {
        const clientName = f.clients ? `${f.clients.prenom || ''} ${f.clients.nom}` : '—';
        return `<tr class="table-row">
            <td style="padding:1rem; font-weight:600; color:${f.type_doc === 'devis' ? 'var(--accent-primary)' : 'var(--accent-secondary)'};">${f.numero}</td>
            <td style="padding:1rem; font-size:0.9rem;">${formatDate(f.date_facture)}</td>
            <td style="padding:1rem; font-weight:500;">${clientName}</td>
            <td style="padding:1rem; font-weight:600;">${formatFCFA(f.total)}</td>
            <td style="padding:1rem; font-size:0.9rem;">${formatFCFA(f.montant_paye)}</td>
            <td style="padding:1rem;">${getStatusBadge(f.statut)}</td>
            <td style="padding:1rem; text-align:right;">
                <button class="icon-btn btn-delete-facture" data-id="${f.id}" title="Supprimer" style="color:var(--accent-danger);"><i data-lucide="trash-2" style="width:16px;"></i></button>
            </td>
        </tr>`;
    }

    function attachFactureActions() {
        document.querySelectorAll('.btn-delete-facture').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Supprimer cette facture ?')) {
                    await db.deleteFacture(btn.dataset.id);
                    showToast('Facture supprimée');
                    renderFactures();
                }
            });
        });
    }

    // ==================== NOUVELLE VENTE ====================
    async function renderNouvelleVente() {
        const clients = await db.getClients();
        const nextNum = await db.getNextFactureNumero('facture');

        viewContainer.innerHTML = `
        <div class="sales-view animate-fade-in">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div>
                    <h2 style="font-size:1.5rem; font-weight:600; color:var(--text-main);">Nouvelle Vente</h2>
                    <p style="color:var(--text-muted); font-size:0.9rem;">Créer une facture ou un devis</p>
                </div>
            </header>
            <form id="form-new-sale" class="glass-panel p-4">
                <div class="form-grid" style="margin-bottom:1.5rem;">
                    <div class="input-group">
                        <label>N° Document</label>
                        <input type="text" name="numero" value="${nextNum}" required>
                    </div>
                    <div class="input-group">
                        <label>Client *</label>
                        <select name="client_id" required>
                            <option value="">— Sélectionner —</option>
                            ${clients.map(c => `<option value="${c.id}">${c.prenom || ''} ${c.nom}</option>`).join('')}
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Date</label>
                        <input type="date" name="date_facture" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="input-group">
                        <label>Type</label>
                        <select name="type_doc">
                            <option value="facture">Facture</option>
                            <option value="devis">Devis</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Total (FCFA) *</label>
                        <input type="number" name="total" min="0" required placeholder="0">
                    </div>
                    <div class="input-group">
                        <label>Montant Payé (FCFA)</label>
                        <input type="number" name="montant_paye" min="0" value="0" placeholder="0">
                    </div>
                    <div class="input-group">
                        <label>Statut</label>
                        <select name="statut">
                            <option value="Impayé">Impayé</option>
                            <option value="Acompte">Acompte</option>
                            <option value="Payé">Payé</option>
                            <option value="Devis">Devis</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn-submit" style="width:100%;">💾 Enregistrer la vente</button>
            </form>
        </div>`;

        lucide.createIcons();

        document.getElementById('form-new-sale').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            try {
                await db.addFacture(data);
                showToast('Vente enregistrée avec succès !');
                navItems.forEach(n => n.classList.remove('active'));
                document.querySelector('[data-view="invoices"]').classList.add('active');
                window.appRenderView('invoices', 'Factures & Devis');
            } catch (err) {
                showToast('Erreur: ' + err.message, 'error');
            }
        });
    }

    // ==================== PRESCRIPTIONS ====================
    async function renderPrescriptions() {
        const prescriptions = await db.getPrescriptions();
        const clients = await db.getClients();

        viewContainer.innerHTML = `
        <div class="prescriptions-view animate-fade-in">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div>
                    <h2 style="font-size:1.5rem; font-weight:600; color:var(--text-main);">Dossier Médical & Prescriptions</h2>
                    <p style="color:var(--text-muted); font-size:0.9rem;">${prescriptions.length} prescription(s) enregistrée(s)</p>
                </div>
                <button class="btn-submit" id="btn-add-prescription" style="display:flex; align-items:center; gap:0.5rem;">
                    <i data-lucide="plus" style="width:18px"></i> Nouvelle Ordonnance
                </button>
            </header>

            <div class="glass-panel p-4" style="margin-bottom:1.5rem;">
                <h3 style="margin-bottom:1rem; color:var(--text-main);">Dernières Prescriptions</h3>
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                    <thead><tr style="border-bottom:1px solid var(--border-glass);">
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Date</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Client</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Médecin</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">OD (SPH/CYL/AXE)</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">OG (SPH/CYL/AXE)</th>
                        <th style="padding:1rem; text-align:right; color:var(--text-muted); font-size:0.85rem;">Actions</th>
                    </tr></thead>
                    <tbody>
                        ${prescriptions.map(p => `
                            <tr class="table-row">
                                <td style="padding:1rem; font-size:0.9rem;">${formatDate(p.date_prescription)}</td>
                                <td style="padding:1rem; font-weight:600; color:var(--accent-secondary);">${p.clients ? p.clients.prenom + ' ' + p.clients.nom : '—'}</td>
                                <td style="padding:1rem; font-size:0.9rem;">${p.medecin || '—'}</td>
                                <td style="padding:1rem; font-family:monospace; font-size:0.85rem;">${p.od_sphere || '—'} / ${p.od_cylindre || '—'} / ${p.od_axe || '—'}</td>
                                <td style="padding:1rem; font-family:monospace; font-size:0.85rem;">${p.og_sphere || '—'} / ${p.og_cylindre || '—'} / ${p.og_axe || '—'}</td>
                                <td style="padding:1rem; text-align:right;">
                                    <button class="icon-btn btn-delete-prescription" data-id="${p.id}" title="Supprimer" style="color:var(--accent-danger);"><i data-lucide="trash-2" style="width:16px;"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${prescriptions.length === 0 ? '<p style="padding:2rem; text-align:center; color:var(--text-muted);">Aucune prescription. Ajoutez la première !</p>' : ''}
            </div>
        </div>`;

        lucide.createIcons();

        document.getElementById('btn-add-prescription').addEventListener('click', () => {
            openModal('Nouvelle Prescription', `
                <div class="form-grid">
                    <div class="input-group"><label>Client *</label><select name="client_id" required><option value="">— Sélectionner —</option>${clients.map(c => `<option value="${c.id}">${c.prenom || ''} ${c.nom}</option>`).join('')}</select></div>
                    <div class="input-group"><label>Médecin</label><input type="text" name="medecin" placeholder="Dr. ..."></div>
                    <div class="input-group"><label>Date</label><input type="date" name="date_prescription" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="input-group"><label>Écart Pupillaire</label><input type="text" name="ecart_pupillaire" placeholder="62mm"></div>
                </div>
                <div style="margin-top: 1.5rem; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; color: var(--text-main); min-width: 500px;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border-glass); text-align: center;">
                                <th style="padding: 0.75rem 0.5rem; font-weight: 500; font-size: 0.85rem; text-align: left; color: var(--text-muted); width: 140px;">Œil</th>
                                <th style="padding: 0.75rem 0.5rem; font-weight: 500; font-size: 0.85rem; color: var(--text-muted);">Sphère (SPH)</th>
                                <th style="padding: 0.75rem 0.5rem; font-weight: 500; font-size: 0.85rem; color: var(--text-muted);">Cylindre (CYL)</th>
                                <th style="padding: 0.75rem 0.5rem; font-weight: 500; font-size: 0.85rem; color: var(--text-muted);">Axe (AXE)</th>
                                <th style="padding: 0.75rem 0.5rem; font-weight: 500; font-size: 0.85rem; color: var(--text-muted);">Addition (ADD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding: 0.75rem 0.5rem; color: var(--accent-secondary); font-weight: 600; font-size: 0.9rem;">
                                    👁 Œil Droit (OD)
                                </td>
                                <td style="padding: 0.5rem;"><input type="text" name="od_sphere" placeholder="+0.00" style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); color: white; border-radius: 6px; text-align: center; outline: none; font-size: 0.9rem;"></td>
                                <td style="padding: 0.5rem;"><input type="text" name="od_cylindre" placeholder="-0.00" style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); color: white; border-radius: 6px; text-align: center; outline: none; font-size: 0.9rem;"></td>
                                <td style="padding: 0.5rem;"><input type="text" name="od_axe" placeholder="180°" style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); color: white; border-radius: 6px; text-align: center; outline: none; font-size: 0.9rem;"></td>
                                <td style="padding: 0.5rem;"><input type="text" name="od_addition" placeholder="+2.00" style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); color: white; border-radius: 6px; text-align: center; outline: none; font-size: 0.9rem;"></td>
                            </tr>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding: 0.75rem 0.5rem; color: var(--accent-success); font-weight: 600; font-size: 0.9rem;">
                                    👁 Œil Gauche (OG)
                                </td>
                                <td style="padding: 0.5rem;"><input type="text" name="og_sphere" placeholder="+0.00" style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); color: white; border-radius: 6px; text-align: center; outline: none; font-size: 0.9rem;"></td>
                                <td style="padding: 0.5rem;"><input type="text" name="og_cylindre" placeholder="-0.00" style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); color: white; border-radius: 6px; text-align: center; outline: none; font-size: 0.9rem;"></td>
                                <td style="padding: 0.5rem;"><input type="text" name="og_axe" placeholder="180°" style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); color: white; border-radius: 6px; text-align: center; outline: none; font-size: 0.9rem;"></td>
                                <td style="padding: 0.5rem;"><input type="text" name="og_addition" placeholder="+2.00" style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); color: white; border-radius: 6px; text-align: center; outline: none; font-size: 0.9rem;"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="input-group" style="margin-top:1.5rem;"><label>Observations</label><input type="text" name="observations" placeholder="Verres progressifs, antireflet..."></div>
            `, async (data) => {
                await db.addPrescription(data);
                showToast('Prescription enregistrée');
                renderPrescriptions();
            });
        });

        document.querySelectorAll('.btn-delete-prescription').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Supprimer cette prescription ?')) {
                    await db.deletePrescription(btn.dataset.id);
                    showToast('Prescription supprimée');
                    renderPrescriptions();
                }
            });
        });
    }

    // ==================== AGENDA ====================
    async function renderAgenda() {
        const today = new Date().toISOString().split('T')[0];
        const rdvs = await db.getRendezVous();
        const todayRdvs = rdvs.filter(r => r.date_rdv === today);
        const clients = await db.getClients();

        viewContainer.innerHTML = `
        <div class="agenda-view animate-fade-in">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div>
                    <h2 style="font-size:1.5rem; font-weight:600; color:var(--text-main);">Agenda & Rendez-vous</h2>
                    <p style="color:var(--text-muted); font-size:0.9rem;">${todayRdvs.length} RDV aujourd'hui — ${rdvs.length} au total</p>
                </div>
                <button class="btn-submit" id="btn-add-rdv" style="display:flex; align-items:center; gap:0.5rem;">
                    <i data-lucide="plus" style="width:18px"></i> Planifier un RDV
                </button>
            </header>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
                <div class="glass-panel p-4">
                    <h3 style="margin-bottom:1rem; color:var(--accent-secondary);">📅 Aujourd'hui</h3>
                    ${todayRdvs.length === 0 ? '<p style="color:var(--text-muted);">Aucun rendez-vous aujourd\'hui.</p>' :
                        todayRdvs.map(r => `
                            <div style="background:rgba(139,92,246,0.1); border-left:3px solid var(--accent-primary); padding:0.75rem; border-radius:4px; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <div style="font-weight:600; font-size:0.95rem;">${r.heure_debut?.slice(0,5)} — ${r.heure_fin?.slice(0,5) || '?'}</div>
                                    <div style="font-size:0.9rem; color:var(--text-main);">${r.clients ? r.clients.prenom + ' ' + r.clients.nom : '—'}</div>
                                    <div style="font-size:0.8rem; color:var(--accent-primary);">${r.motif || ''}</div>
                                </div>
                                <button class="icon-btn btn-delete-rdv" data-id="${r.id}" style="color:var(--accent-danger);"><i data-lucide="trash-2" style="width:16px;"></i></button>
                            </div>
                        `).join('')}
                </div>

                <div class="glass-panel p-4">
                    <h3 style="margin-bottom:1rem; color:var(--text-main);">📋 Tous les rendez-vous</h3>
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead><tr style="border-bottom:1px solid var(--border-glass);">
                            <th style="padding:0.75rem; color:var(--text-muted); font-size:0.85rem;">Date</th>
                            <th style="padding:0.75rem; color:var(--text-muted); font-size:0.85rem;">Heure</th>
                            <th style="padding:0.75rem; color:var(--text-muted); font-size:0.85rem;">Client</th>
                            <th style="padding:0.75rem; color:var(--text-muted); font-size:0.85rem;">Motif</th>
                        </tr></thead>
                        <tbody>
                            ${rdvs.map(r => `
                                <tr class="table-row">
                                    <td style="padding:0.75rem; font-size:0.9rem;">${formatDate(r.date_rdv)}</td>
                                    <td style="padding:0.75rem; font-weight:600;">${r.heure_debut?.slice(0,5)}</td>
                                    <td style="padding:0.75rem;">${r.clients ? r.clients.prenom + ' ' + r.clients.nom : '—'}</td>
                                    <td style="padding:0.75rem; font-size:0.85rem; color:var(--text-muted);">${r.motif || '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${rdvs.length === 0 ? '<p style="padding:1rem; text-align:center; color:var(--text-muted);">Aucun rendez-vous planifié.</p>' : ''}
                </div>
            </div>
        </div>`;

        lucide.createIcons();

        document.getElementById('btn-add-rdv').addEventListener('click', () => {
            openModal('Planifier un Rendez-vous', `
                <div class="form-grid">
                    <div class="input-group"><label>Client *</label><select name="client_id" required><option value="">— Sélectionner —</option>${clients.map(c => `<option value="${c.id}">${c.prenom || ''} ${c.nom}</option>`).join('')}</select></div>
                    <div class="input-group"><label>Motif</label><select name="motif"><option>Consultation (Examen de vue)</option><option>Choix de monture</option><option>Livraison / Essayage</option><option>SAV / Ajustement</option></select></div>
                    <div class="input-group"><label>Date *</label><input type="date" name="date_rdv" value="${today}" required></div>
                    <div class="input-group"><label>Heure début *</label><input type="time" name="heure_debut" required></div>
                    <div class="input-group"><label>Heure fin</label><input type="time" name="heure_fin"></div>
                    <div class="input-group"><label>Notes</label><input type="text" name="notes" placeholder="Précisions..."></div>
                </div>
            `, async (data) => {
                await db.addRendezVous(data);
                showToast('Rendez-vous planifié');
                renderAgenda();
            });
        });

        document.querySelectorAll('.btn-delete-rdv').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Supprimer ce rendez-vous ?')) {
                    await db.deleteRendezVous(btn.dataset.id);
                    showToast('RDV supprimé');
                    renderAgenda();
                }
            });
        });
    }

    // ==================== STOCK ====================
    async function renderStock() {
        const stock = await db.getStock();

        viewContainer.innerHTML = `
        <div class="stock-view animate-fade-in">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div>
                    <h2 style="font-size:1.5rem; font-weight:600; color:var(--text-main);">Stock Optique</h2>
                    <p style="color:var(--text-muted); font-size:0.9rem;">${stock.length} produit(s) en stock</p>
                </div>
                <button class="btn-submit" id="btn-add-produit" style="display:flex; align-items:center; gap:0.5rem;">
                    <i data-lucide="plus" style="width:18px"></i> Ajouter Produit
                </button>
            </header>

            <div class="glass-panel" style="padding:1.25rem; margin-bottom:1.5rem; display:flex; gap:1rem; flex-wrap:wrap;">
                <select id="filter-categorie" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-glass); color:var(--text-main); padding:0.6rem 1rem; border-radius:6px; outline:none;">
                    <option value="all">Toutes catégories</option>
                    <option value="Montures">Montures</option>
                    <option value="Verres">Verres</option>
                    <option value="Lentilles">Lentilles</option>
                    <option value="Accessoires">Accessoires</option>
                </select>
            </div>

            <div class="glass-panel" style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                    <thead><tr style="border-bottom:1px solid var(--border-glass);">
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Produit</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Catégorie</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Qté</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Prix Achat</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Prix Vente</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Fournisseur</th>
                        <th style="padding:1rem; text-align:right; color:var(--text-muted); font-size:0.85rem;">Actions</th>
                    </tr></thead>
                    <tbody id="stock-tbody">
                        ${stock.map(p => stockRow(p)).join('')}
                    </tbody>
                </table>
                ${stock.length === 0 ? '<p style="padding:2rem; text-align:center; color:var(--text-muted);">Stock vide. Ajoutez vos premiers produits !</p>' : ''}
            </div>
        </div>`;

        lucide.createIcons();

        document.getElementById('filter-categorie').addEventListener('change', async (e) => {
            const results = await db.getStock(e.target.value);
            document.getElementById('stock-tbody').innerHTML = results.map(p => stockRow(p)).join('');
            lucide.createIcons();
            attachStockActions();
        });

        document.getElementById('btn-add-produit').addEventListener('click', async () => {
            const fournisseurs = await db.getFournisseurs();
            openModal('Ajouter un Produit', `
                <div class="form-grid">
                    <div class="input-group"><label>Nom *</label><input type="text" name="nom" required placeholder="Ray-Ban Aviator..."></div>
                    <div class="input-group"><label>Catégorie *</label><select name="categorie" required><option value="Montures">Montures</option><option value="Verres">Verres</option><option value="Lentilles">Lentilles</option><option value="Accessoires">Accessoires</option></select></div>
                    <div class="input-group"><label>Quantité</label><input type="number" name="quantite" min="0" value="0"></div>
                    <div class="input-group"><label>Seuil d'alerte</label><input type="number" name="seuil_alerte" min="0" value="5"></div>
                    <div class="input-group"><label>Prix Achat (FCFA)</label><input type="number" name="prix_achat" min="0" value="0"></div>
                    <div class="input-group"><label>Prix Vente (FCFA)</label><input type="number" name="prix_vente" min="0" value="0"></div>
                    <div class="input-group" style="grid-column: span 2;"><label>Fournisseur</label><select name="fournisseur_id"><option value="">— Aucun —</option>${fournisseurs.map(f => `<option value="${f.id}">${f.nom}</option>`).join('')}</select></div>
                </div>
            `, async (data) => {
                if (!data.fournisseur_id) delete data.fournisseur_id;
                await db.addProduit(data);
                showToast('Produit ajouté');
                renderStock();
            });
        });

        attachStockActions();
    }

    function stockRow(p) {
        const isLow = p.quantite <= p.seuil_alerte;
        return `<tr class="table-row">
            <td style="padding:1rem; font-weight:600;">${p.nom}</td>
            <td style="padding:1rem; font-size:0.9rem;">${p.categorie}</td>
            <td style="padding:1rem; font-weight:700; color:${isLow ? 'var(--accent-danger)' : 'var(--accent-success)'};">${p.quantite} ${isLow ? '⚠️' : ''}</td>
            <td style="padding:1rem; font-size:0.9rem;">${formatFCFA(p.prix_achat)}</td>
            <td style="padding:1rem; font-size:0.9rem;">${formatFCFA(p.prix_vente)}</td>
            <td style="padding:1rem; font-size:0.9rem; color:var(--text-muted);">${p.fournisseurs?.nom || '—'}</td>
            <td style="padding:1rem; text-align:right;">
                <button class="icon-btn btn-delete-produit" data-id="${p.id}" title="Supprimer" style="color:var(--accent-danger);"><i data-lucide="trash-2" style="width:16px;"></i></button>
            </td>
        </tr>`;
    }

    function attachStockActions() {
        document.querySelectorAll('.btn-delete-produit').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Supprimer ce produit ?')) {
                    await db.deleteProduit(btn.dataset.id);
                    showToast('Produit supprimé');
                    renderStock();
                }
            });
        });
    }

    // ==================== FOURNISSEURS ====================
    async function renderFournisseurs() {
        const fournisseurs = await db.getFournisseurs();

        viewContainer.innerHTML = `
        <div class="fournisseurs-view animate-fade-in">
            <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div>
                    <h2 style="font-size:1.5rem; font-weight:600; color:var(--text-main);">Fournisseurs</h2>
                    <p style="color:var(--text-muted); font-size:0.9rem;">${fournisseurs.length} fournisseur(s)</p>
                </div>
                <button class="btn-submit" id="btn-add-fournisseur" style="display:flex; align-items:center; gap:0.5rem;">
                    <i data-lucide="plus" style="width:18px"></i> Ajouter Fournisseur
                </button>
            </header>

            <div class="glass-panel" style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                    <thead><tr style="border-bottom:1px solid var(--border-glass);">
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Nom</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Contact</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Téléphone</th>
                        <th style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Email</th>
                        <th style="padding:1rem; text-align:right; color:var(--text-muted); font-size:0.85rem;">Actions</th>
                    </tr></thead>
                    <tbody>
                        ${fournisseurs.map(f => `
                            <tr class="table-row">
                                <td style="padding:1rem; font-weight:600;">${f.nom}</td>
                                <td style="padding:1rem; font-size:0.9rem;">${f.contact || '—'}</td>
                                <td style="padding:1rem; font-size:0.9rem;">${f.telephone || '—'}</td>
                                <td style="padding:1rem; font-size:0.9rem; color:var(--text-muted);">${f.email || '—'}</td>
                                <td style="padding:1rem; text-align:right;">
                                    <button class="icon-btn btn-delete-fournisseur" data-id="${f.id}" title="Supprimer" style="color:var(--accent-danger);"><i data-lucide="trash-2" style="width:16px;"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${fournisseurs.length === 0 ? '<p style="padding:2rem; text-align:center; color:var(--text-muted);">Aucun fournisseur enregistré.</p>' : ''}
            </div>
        </div>`;

        lucide.createIcons();

        document.getElementById('btn-add-fournisseur').addEventListener('click', () => {
            openModal('Nouveau Fournisseur', `
                <div class="form-grid">
                    <div class="input-group"><label>Nom *</label><input type="text" name="nom" required placeholder="Essilor..."></div>
                    <div class="input-group"><label>Contact</label><input type="text" name="contact" placeholder="M. Dupont"></div>
                    <div class="input-group"><label>Téléphone</label><input type="text" name="telephone" placeholder="33 820 00 00"></div>
                    <div class="input-group"><label>Email</label><input type="email" name="email"></div>
                    <div class="input-group" style="grid-column: span 2;"><label>Adresse</label><input type="text" name="adresse"></div>
                </div>
            `, async (data) => {
                await db.addFournisseur(data);
                showToast('Fournisseur ajouté');
                renderFournisseurs();
            });
        });

        document.querySelectorAll('.btn-delete-fournisseur').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Supprimer ce fournisseur ?')) {
                    await db.deleteFournisseur(btn.dataset.id);
                    showToast('Fournisseur supprimé');
                    renderFournisseurs();
                }
            });
        });
    }

    // ==================== NAVIGATION ====================
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            const view = item.getAttribute('data-view');
            const title = item.getAttribute('data-title');
            window.appRenderView(view, view === 'dashboard' ? null : title);
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    // Mobile Menu
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Recherche Globale
    const globalSearchInput = document.querySelector('.top-header .global-search input');
    if (globalSearchInput) {
        let searchTimeout;
        globalSearchInput.addEventListener('input', async (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const results = await db.recherche(e.target.value);
                console.log('Résultats recherche:', results);
            }, 400);
        });
    }

    // Init: charge le dashboard
    window.appRenderView('dashboard');
});
