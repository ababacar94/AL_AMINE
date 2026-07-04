-- ============================================
-- ALAMINE FACT — Script de création des tables
-- À exécuter dans Supabase > SQL Editor
-- ============================================

-- 1. Table CLIENTS
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    telephone VARCHAR(30),
    email VARCHAR(150),
    adresse TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table FOURNISSEURS
CREATE TABLE IF NOT EXISTS fournisseurs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    contact VARCHAR(100),
    telephone VARCHAR(30),
    email VARCHAR(150),
    adresse TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table PRODUITS / STOCK
CREATE TABLE IF NOT EXISTS produits_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    categorie VARCHAR(50) NOT NULL CHECK (categorie IN ('Montures', 'Verres', 'Lentilles', 'Accessoires')),
    quantite INTEGER DEFAULT 0,
    prix_achat NUMERIC(12,2) DEFAULT 0,
    prix_vente NUMERIC(12,2) DEFAULT 0,
    seuil_alerte INTEGER DEFAULT 5,
    fournisseur_id UUID REFERENCES fournisseurs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    medecin VARCHAR(150),
    date_prescription DATE DEFAULT CURRENT_DATE,
    ecart_pupillaire VARCHAR(20),
    -- Œil Droit
    od_sphere VARCHAR(20),
    od_cylindre VARCHAR(20),
    od_axe VARCHAR(20),
    od_addition VARCHAR(20),
    -- Œil Gauche
    og_sphere VARCHAR(20),
    og_cylindre VARCHAR(20),
    og_axe VARCHAR(20),
    og_addition VARCHAR(20),
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Table FACTURES
CREATE TABLE IF NOT EXISTS factures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero VARCHAR(30) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    date_facture DATE DEFAULT CURRENT_DATE,
    total NUMERIC(12,2) DEFAULT 0,
    montant_paye NUMERIC(12,2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'Impayé' CHECK (statut IN ('Payé', 'Acompte', 'Impayé', 'Devis')),
    type_doc VARCHAR(20) DEFAULT 'facture' CHECK (type_doc IN ('facture', 'devis')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Table RENDEZ-VOUS
CREATE TABLE IF NOT EXISTS rendez_vous (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date_rdv DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME,
    motif VARCHAR(100),
    notes TEXT,
    notification_sms BOOLEAN DEFAULT true,
    notification_whatsapp BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES pour la performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_prescriptions_client ON prescriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_date ON rendez_vous(date_rdv);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits_stock(categorie);

-- ============================================
-- ROW LEVEL SECURITY (activer mais tout autoriser pour l'instant)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;

-- Policies: autoriser tout pour les utilisateurs anonymes (développement)
CREATE POLICY "Allow all for anon" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON fournisseurs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON produits_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON factures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON rendez_vous FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DONNÉES DE DÉMONSTRATION
-- ============================================

-- Clients
INSERT INTO clients (nom, prenom, telephone, email, adresse) VALUES
('Diop', 'Mamadou', '77 123 45 67', 'mamadou.diop@email.sn', 'Dakar, Plateau'),
('Sow', 'Aissatou', '78 234 56 78', 'aissatou.sow@email.sn', 'Dakar, Mermoz'),
('Fall', 'Omar', '76 345 67 89', 'omar.fall@email.sn', 'Thiès, Centre'),
('Ndiaye', 'Fatou', '70 456 78 90', 'fatou.ndiaye@email.sn', 'Dakar, Almadies'),
('Diallo', 'Ousmane', '77 567 89 01', 'ousmane.diallo@email.sn', 'Saint-Louis');

-- Fournisseurs
INSERT INTO fournisseurs (nom, contact, telephone, email, adresse) VALUES
('Essilor Sénégal', 'M. Barry', '33 820 00 00', 'contact@essilor.sn', 'Dakar, Zone Industrielle'),
('Luxottica West Africa', 'Mme Diagne', '33 821 11 11', 'info@luxottica-wa.com', 'Abidjan, Plateau'),
('OptikPlus', 'M. Traoré', '33 822 22 22', 'commande@optikplus.sn', 'Dakar, Liberté 6');

-- Produits Stock
INSERT INTO produits_stock (nom, categorie, quantite, prix_achat, prix_vente, seuil_alerte) VALUES
('Ray-Ban Aviator Classic', 'Montures', 12, 25000, 65000, 5),
('Oakley Holbrook', 'Montures', 8, 30000, 75000, 5),
('Monture Titan Flex', 'Montures', 3, 15000, 40000, 5),
('Verre Progressif Essilor', 'Verres', 20, 18000, 45000, 10),
('Verre Anti-Lumière Bleue', 'Verres', 15, 12000, 30000, 10),
('Verre Unifocal Standard', 'Verres', 45, 5000, 15000, 15),
('Lentille Journalière Acuvue', 'Lentilles', 30, 8000, 20000, 10),
('Lentille Mensuelle Air Optix', 'Lentilles', 4, 10000, 25000, 5),
('Spray Nettoyant Optique', 'Accessoires', 50, 1000, 3500, 15),
('Étui Rigide Premium', 'Accessoires', 25, 2000, 6000, 10);

-- Prescriptions (liées aux clients existants via subquery)
INSERT INTO prescriptions (client_id, medecin, date_prescription, ecart_pupillaire, od_sphere, od_cylindre, od_axe, od_addition, og_sphere, og_cylindre, og_axe, og_addition, observations)
SELECT id, 'Dr. Sow', '2026-06-20', '62mm', '-1.50', '-0.50', '180', '', '-1.25', '-0.75', '175', '', 'Verres progressifs, antireflet'
FROM clients WHERE nom = 'Diop' LIMIT 1;

INSERT INTO prescriptions (client_id, medecin, date_prescription, ecart_pupillaire, od_sphere, od_cylindre, od_axe, od_addition, og_sphere, og_cylindre, og_axe, og_addition, observations)
SELECT id, 'Dr. Fall', '2026-06-18', '64mm', '+2.00', '', '', '+1.50', '+1.75', '', '', '+1.50', 'Presbytie, verres progressifs'
FROM clients WHERE nom = 'Sow' LIMIT 1;

-- Factures
INSERT INTO factures (numero, client_id, date_facture, total, montant_paye, statut, type_doc)
SELECT 'FACT-26001', id, '2026-06-22', 120000, 120000, 'Payé', 'facture' FROM clients WHERE nom = 'Diop' LIMIT 1;

INSERT INTO factures (numero, client_id, date_facture, total, montant_paye, statut, type_doc)
SELECT 'FACT-26002', id, '2026-06-21', 45000, 20000, 'Acompte', 'facture' FROM clients WHERE nom = 'Sow' LIMIT 1;

INSERT INTO factures (numero, client_id, date_facture, total, montant_paye, statut, type_doc)
SELECT 'DEV-0084', id, '2026-06-20', 85000, 0, 'Devis', 'devis' FROM clients WHERE nom = 'Fall' LIMIT 1;

-- Rendez-vous
INSERT INTO rendez_vous (client_id, date_rdv, heure_debut, heure_fin, motif, notes)
SELECT id, CURRENT_DATE, '10:00', '10:30', 'Consultation (Examen de vue)', 'Premier examen' FROM clients WHERE nom = 'Ndiaye' LIMIT 1;

INSERT INTO rendez_vous (client_id, date_rdv, heure_debut, heure_fin, motif, notes)
SELECT id, CURRENT_DATE, '14:30', '15:00', 'Livraison / Essayage', 'Lunettes prêtes' FROM clients WHERE nom = 'Diallo' LIMIT 1;
