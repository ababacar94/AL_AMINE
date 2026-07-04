# Copyright (c) 2026, Alamine and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class OrdreAtelier(Document):
	def on_update(self):
		if self.statut == "Livr\u00e9e":
			frappe.msgprint(f"L'ordre {self.name} a \u00e9t\u00e9 livr\u00e9 avec succ\u00e8s.")
