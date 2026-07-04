# Copyright (c) 2026, Alamine and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class Client(Document):
	def validate(self):
		if self.telephone:
			# Format phone numbers if necessary
			pass
