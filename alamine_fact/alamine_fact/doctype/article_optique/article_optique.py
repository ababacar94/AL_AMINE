# Copyright (c) 2026, Alamine and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ArticleOptique(Document):
	def validate(self):
		if self.quantite_stock <= self.seuil_alerte:
			frappe.msgprint(f"Alerte de stock bas pour l'article {self.name}!")
