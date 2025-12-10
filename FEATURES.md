# 📱 Plan B - Fonctionnalités

## 🆕 Nouvelles Fonctionnalités

### ➕ Ajouter un Nouveau Bar

Les utilisateurs peuvent maintenant ajouter leurs bars préférés à l'application !

**Accès**: 
- Bouton flottant orange "+" en bas à droite de l'écran d'accueil

**Informations requises**:
- ✅ Nom du bar
- ✅ Adresse complète
- ✅ Type de bar (Bar à cocktails, Pub, Brasserie, etc.)
- ✅ Horaires Happy Hour (début et fin)
- ✅ Prix Happy Hour (bière et cocktail)

**Informations optionnelles**:
- 📷 URL de la photo (photo par défaut si non fournie)
- 📍 Coordonnées GPS (latitude/longitude) - Centre de Paris par défaut

**Validation**:
- Format des horaires: HH:MM (ex: 17:00)
- Prix en euros (format décimal accepté)
- Coordonnées GPS valides si fournies

**Navigation**:
```
Écran d'accueil → Bouton [+] → Formulaire d'ajout → Enregistrer
```

---

### ✏️ Modifier un Bar Existant

Les utilisateurs peuvent mettre à jour les horaires et les prix lorsqu'ils changent !

**Accès**:
- Bouton crayon ✏️ en haut à droite de la page détails du bar

**Champs modifiables**:
- ⏰ Horaires Happy Hour (début et fin)
- 💶 Prix Happy Hour (bière et cocktail)

**Informations non modifiables**:
- Nom, adresse, type, photo, coordonnées GPS
- (Ces informations restent fixes pour maintenir l'intégrité des données)

**Navigation**:
```
Détails du bar → Bouton [✏️] → Formulaire de modification → Enregistrer
```

---

## 🎨 Interface Utilisateur

### Écran d'Ajout de Bar (`/bar/add`)

**Design**:
- En-tête orange avec titre "Ajouter un Bar"
- Formulaire organisé en sections:
  - 📋 Informations de base
  - 📍 Coordonnées GPS (optionnel)
  - ⏰ Happy Hour
  - 💶 Prix

**Validation en temps réel**:
- Messages d'erreur clairs et explicites
- Indication des champs obligatoires (*)
- Validation avant soumission

**UX**:
- Claviers adaptés (numérique pour prix, URL pour photos)
- Placeholders informatifs
- Scroll fluide avec indicateurs visuels
- Bouton retour pour annuler

---

### Écran de Modification (`/bar/edit/[id]`)

**Design**:
- En-tête orange avec titre "Modifier le bar"
- Affichage du nom et adresse du bar (lecture seule)
- Formulaire simplifié avec uniquement les champs modifiables

**Fonctionnalités**:
- Chargement automatique des valeurs actuelles
- Validation en temps réel
- Confirmation de sauvegarde
- Retour automatique après succès

**UX**:
- Interface épurée et focalisée
- Messages de succès/erreur
- Indicateur de chargement pendant la sauvegarde

---

## 🎯 Accessibilité

### Boutons d'Accès Rapide

1. **Floating Action Button (FAB)** sur l'écran d'accueil
   - Position: En bas à droite
   - Couleur: Orange (#f97316)
   - Icône: "+" blanc
   - Ombre portée pour le mettre en valeur
   - Toujours accessible en scrollant

2. **Bouton d'Édition** sur la page détails
   - Position: En haut à droite (à côté du bouton fermer)
   - Icône: ✏️ (crayon)
   - Style: Fond blanc avec ombre

### Navigation

Tous les écrans incluent:
- ✅ Bouton retour en haut à gauche
- ✅ Titre clair de la page
- ✅ Navigation intuitive avec Expo Router

---

## 🔐 Sécurité & Validation

### Validation Côté Client

**Horaires Happy Hour**:
- Format strict: HH:MM
- Heures: 00-23
- Minutes: 00-59

**Prix**:
- Valeurs numériques uniquement
- Décimales acceptées (ex: 3.50)
- Minimum: 0

**Coordonnées GPS**:
- Latitude: -90 à +90
- Longitude: -180 à +180
- Optionnelles (valeurs par défaut si omises)

### Messages d'Erreur

Exemples de messages clairs:
- ❌ "Le nom du bar est requis"
- ❌ "Format de l'heure de début invalide (HH:MM)"
- ❌ "Prix de la bière invalide"
- ❌ "Latitude invalide"

---

## 📱 Compatibilité

- ✅ iOS
- ✅ Android
- ✅ Web
- ✅ Responsive design
- ✅ Support clavier natif
- ✅ Gestion du clavier (KeyboardAvoidingView)

---

## 🚀 Technologies Utilisées

- **React Native** - Framework mobile
- **Expo Router** - Navigation file-based
- **NativeWind** - Styling Tailwind pour React Native
- **TypeScript** - Type safety
- **AsyncStorage** - Stockage local
- **Supabase** - Backend & API

---

## 📊 Flux de Données

### Ajout d'un Bar

```
Utilisateur → Formulaire → Validation
                ↓
         API createBar()
                ↓
         Backend Supabase
                ↓
         Retour liste actualisée
```

### Modification d'un Bar

```
Chargement bar (getBar) → Affichage formulaire
                               ↓
                    Modifications utilisateur
                               ↓
                         Validation
                               ↓
                      API updateBar()
                               ↓
                     Backend Supabase
                               ↓
                    Retour à la page détails
```

---

## 💡 Conseils d'Utilisation

### Pour ajouter un bar rapidement:

1. Cliquez sur le bouton **[+]** orange
2. Remplissez les informations essentielles:
   - Nom, adresse, type
   - Horaires (format 17:00)
   - Prix en euros
3. Laissez les coordonnées GPS vides si vous ne les connaissez pas
4. Ajoutez une photo ou laissez la photo par défaut
5. Cliquez sur **"Ajouter le bar"**

### Pour modifier les prix/horaires:

1. Ouvrez les détails d'un bar
2. Cliquez sur le bouton **[✏️]** en haut à droite
3. Modifiez les horaires ou prix
4. Cliquez sur **"Enregistrer les modifications"**

---

## 🎉 Améliorations Futures Possibles

- 📸 Sélecteur de photo depuis la galerie
- 📍 Sélection de localisation sur carte
- 🏷️ Tags et catégories
- ⭐ Système de favoris
- 📊 Statistiques des bars
- 🔔 Notifications Happy Hour
- 👥 Partage de bars
- 💬 Commentaires sur les modifications

---

**Développé avec ❤️ pour les amateurs de Happy Hour !** 🍺🍹

