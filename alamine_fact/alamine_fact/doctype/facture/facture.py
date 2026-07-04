# Copyright (c) 2026, Alamine and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class Facture(Document):
	def validate(self):
		self.calculer_total()

	def calculer_total(self):
		total = 0
		for ligne in self.lignes_articles:
			ligne.montant_total = ligne.quantite * ligne.prix_unitaire
			total += ligne.montant_total
		self.montant_total = total

	def on_submit(self):
		self.deduire_stock()
		self.creer_ordre_atelier()

	def deduire_stock(self):
		for ligne in self.lignes_articles:
			article = frappe.get_doc("Article Optique", ligne.article)
			nouveau_stock = article.quantite_stock - ligne.quantite
			if nouveau_stock < 0:
				frappe.throw(f"Stock insuffisant pour l'article {article.name}")
			
			frappe.db.set_value("Article Optique", article.name, "quantite_stock", nouveau_stock)
			
			if nouveau_stock <= article.seuil_alerte:
				frappe.msgprint(f"Alerte : Le stock de l'article {article.name} est bas.")

	def creer_ordre_atelier(self):
		# V\u00e9rifie si la facture contient des verres ou montures n\u00e9cessitant un atelier
		necessite_atelier = any(frappe.db.get_value("Article Optique", l.article, "type_article") in ["Verre", "Monture"] for l in self.lignes_articles)
		
		if necessite_atelier:
			ordre = frappe.new_doc("Ordre Atelier")
			ordre.facture = self.name
			ordre.client = self.client
			ordre.statut = "En attente"
			ordre.insert()
			frappe.msgprint(f"Un ordre d'atelier a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 automatiquement pour cette facture.")
