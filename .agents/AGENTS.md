# Auto-Commit and Push Rule

À chaque fois qu'une modification est apportée au code du projet, l'agent doit automatiquement ajouter, commiter et pousser (push) les changements sur le dépôt GitHub.

**Commandes à exécuter :**
```powershell
& "C:\Program Files\Git\cmd\git.exe" add .
& "C:\Program Files\Git\cmd\git.exe" commit -m "Mise à jour automatique par l'assistant"
& "C:\Program Files\Git\cmd\git.exe" push
```
