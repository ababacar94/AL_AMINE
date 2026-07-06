// ============================================
// DB.JS — Fonctions CRUD Supabase
// ============================================

const db = {

    // ==================== CLIENTS ====================
    async getClients(search = '') {
        let query = supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (search) {
            query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,telephone.ilike.%${search}%`);
        }
        const { data, error } = await query;
        if (error) { console.error('Erreur getClients:', error); return []; }
        return data;
    },

    async addClient(client) {
        const { data, error } = await supabase.from('clients').insert([client]).select();
        if (error) { console.error('Erreur addClient:', error); throw error; }
        return data[0];
    },

    async updateClient(id, updates) {
        const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select();
        if (error) { console.error('Erreur updateClient:', error); throw error; }
        return data[0];
    },

    async deleteClient(id) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) { console.error('Erreur deleteClient:', error); throw error; }
    },

    // ==================== FACTURES ====================
    async getFactures(filters = {}) {
        let query = supabase.from('factures').select('*, clients(nom, prenom)').order('date_facture', { ascending: false });
        if (filters.statut && filters.statut !== 'all') query = query.eq('statut', filters.statut);
        if (filters.search) query = query.ilike('numero', `%${filters.search}%`);
        const { data, error } = await query;
        if (error) { console.error('Erreur getFactures:', error); return []; }
        return data;
    },

    async addFacture(facture) {
        const { data, error } = await supabase.from('factures').insert([facture]).select();
        if (error) { console.error('Erreur addFacture:', error); throw error; }
        return data[0];
    },

    async updateFacture(id, updates) {
        const { data, error } = await supabase.from('factures').update(updates).eq('id', id).select();
        if (error) { console.error('Erreur updateFacture:', error); throw error; }
        return data[0];
    },

    async deleteFacture(id) {
        const { error } = await supabase.from('factures').delete().eq('id', id);
        if (error) { console.error('Erreur deleteFacture:', error); throw error; }
    },

    async getNextFactureNumero(type = 'facture') {
        const prefix = type === 'devis' ? 'DEV' : 'FACT';
        const { data, error } = await supabase.from('factures').select('numero');
        if (error) { console.error('Erreur getNextFactureNumero:', error); return `${prefix}-26001`; }
        if (data && data.length > 0) {
            let maxNum = 0;
            data.forEach(f => {
                const parts = f.numero.split('-');
                if (parts.length > 1) {
                    const num = parseInt(parts[1]);
                    if (!isNaN(num) && num > maxNum) {
                        maxNum = num;
                    }
                }
            });
            if (maxNum > 0) {
                return `${prefix}-${String(maxNum + 1).padStart(5, '0')}`;
            }
        }
        return `${prefix}-26001`;
    },

    // ==================== PRESCRIPTIONS ====================
    async getPrescriptions() {
        const { data, error } = await supabase.from('prescriptions').select('*, clients(nom, prenom)').order('date_prescription', { ascending: false });
        if (error) { console.error('Erreur getPrescriptions:', error); return []; }
        return data;
    },

    async addPrescription(prescription) {
        const { data, error } = await supabase.from('prescriptions').insert([prescription]).select();
        if (error) { console.error('Erreur addPrescription:', error); throw error; }
        return data[0];
    },

    async deletePrescription(id) {
        const { error } = await supabase.from('prescriptions').delete().eq('id', id);
        if (error) { console.error('Erreur deletePrescription:', error); throw error; }
    },

    // ==================== RENDEZ-VOUS ====================
    async getRendezVous(dateFilter = null) {
        let query = supabase.from('rendez_vous').select('*, clients(nom, prenom)').order('date_rdv', { ascending: true }).order('heure_debut', { ascending: true });
        if (dateFilter) query = query.eq('date_rdv', dateFilter);
        const { data, error } = await query;
        if (error) { console.error('Erreur getRendezVous:', error); return []; }
        return data;
    },

    async addRendezVous(rdv) {
        const { data, error } = await supabase.from('rendez_vous').insert([rdv]).select();
        if (error) { console.error('Erreur addRendezVous:', error); throw error; }
        return data[0];
    },

    async deleteRendezVous(id) {
        const { error } = await supabase.from('rendez_vous').delete().eq('id', id);
        if (error) { console.error('Erreur deleteRendezVous:', error); throw error; }
    },

    // ==================== STOCK ====================
    async getStock(categorie = null) {
        let query = supabase.from('produits_stock').select('*, fournisseurs(nom)').order('nom');
        if (categorie && categorie !== 'all') query = query.eq('categorie', categorie);
        const { data, error } = await query;
        if (error) { console.error('Erreur getStock:', error); return []; }
        return data;
    },

    async addProduit(produit) {
        const { data, error } = await supabase.from('produits_stock').insert([produit]).select();
        if (error) { console.error('Erreur addProduit:', error); throw error; }
        return data[0];
    },

    async updateProduit(id, updates) {
        const { data, error } = await supabase.from('produits_stock').update(updates).eq('id', id).select();
        if (error) { console.error('Erreur updateProduit:', error); throw error; }
        return data[0];
    },

    async deleteProduit(id) {
        const { error } = await supabase.from('produits_stock').delete().eq('id', id);
        if (error) { console.error('Erreur deleteProduit:', error); throw error; }
    },

    // ==================== FOURNISSEURS ====================
    async getFournisseurs() {
        const { data, error } = await supabase.from('fournisseurs').select('*').order('nom');
        if (error) { console.error('Erreur getFournisseurs:', error); return []; }
        return data;
    },

    async addFournisseur(fournisseur) {
        const { data, error } = await supabase.from('fournisseurs').insert([fournisseur]).select();
        if (error) { console.error('Erreur addFournisseur:', error); throw error; }
        return data[0];
    },

    async updateFournisseur(id, updates) {
        const { data, error } = await supabase.from('fournisseurs').update(updates).eq('id', id).select();
        if (error) { console.error('Erreur updateFournisseur:', error); throw error; }
        return data[0];
    },

    async deleteFournisseur(id) {
        const { error } = await supabase.from('fournisseurs').delete().eq('id', id);
        if (error) { console.error('Erreur deleteFournisseur:', error); throw error; }
    },

    // ==================== DASHBOARD STATS ====================
    async getDashboardStats() {
        const today = new Date().toISOString().split('T')[0];

        const [prescriptions, factures, stock, rdvs] = await Promise.all([
            supabase.from('prescriptions').select('id', { count: 'exact' }).eq('date_prescription', today),
            supabase.from('factures').select('total, montant_paye, statut'),
            supabase.from('produits_stock').select('*'),
            supabase.from('rendez_vous').select('id', { count: 'exact' }).eq('date_rdv', today)
        ]);

        // Calcul CA & Bénéfice
        const facturesData = factures.data || [];
        const totalCA = facturesData.reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
        const totalPaye = facturesData.reduce((sum, f) => sum + parseFloat(f.montant_paye || 0), 0);

        // Stock faible
        const stockData = stock.data || [];
        const stockFaible = stockData.filter(p => p.quantite <= p.seuil_alerte);
        const stockParCategorie = {};
        stockFaible.forEach(p => {
            if (!stockParCategorie[p.categorie]) stockParCategorie[p.categorie] = 0;
            stockParCategorie[p.categorie]++;
        });

        // Produits par catégorie pour le donut
        const produitsParCategorie = { Montures: 0, Verres: 0, Lentilles: 0, Accessoires: 0 };
        stockData.forEach(p => { produitsParCategorie[p.categorie] = (produitsParCategorie[p.categorie] || 0) + p.quantite; });

        return {
            prescriptionsJour: prescriptions.count || 0,
            rdvsJour: rdvs.count || 0,
            totalCA,
            totalPaye,
            stockFaible,
            stockParCategorie,
            produitsParCategorie,
            nbFactures: facturesData.length
        };
    },

    // ==================== RECHERCHE GLOBALE ====================
    async recherche(query) {
        if (!query || query.length < 2) return { clients: [], factures: [], prescriptions: [] };
        const [clients, factures] = await Promise.all([
            supabase.from('clients').select('*').or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,telephone.ilike.%${query}%`).limit(5),
            supabase.from('factures').select('*, clients(nom, prenom)').or(`numero.ilike.%${query}%`).limit(5)
        ]);
        return {
            clients: clients.data || [],
            factures: factures.data || []
        };
    }
};
