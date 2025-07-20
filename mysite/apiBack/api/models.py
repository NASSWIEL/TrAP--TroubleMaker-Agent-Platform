# Ensure Activite has the type field
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError

# --- User Model ---
class Users(AbstractUser):
    ROLE_CHOICES = [('etudiant', 'Etudiant'), ('encadrant', 'Encadrant')]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='etudiant')
    email = models.EmailField(unique=True, blank=False, null=False)
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['role']
    def __str__(self):
        return self.email or self.username

# --- Categorie Model ---
class Categorie(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.nom

# --- Validator for code_activite ---
code_activite_validator = RegexValidator(
    regex=r'^[A-Z0-9]{1,9}$',
    message='Le code activité doit contenir entre 1 et 9 caractères alphanumériques majuscules.',
    code='invalid_code_activite'
)

# --- Activite Model ---
class Activite(models.Model):
    code_activite = models.CharField(
        max_length=9, primary_key=True, validators=[code_activite_validator],
        help_text="Code unique (1-9 caractères, A-Z, 0-9)."
    )
    titre = models.CharField(max_length=255)
    presentation_publique = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    etudiants_autorises = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name='activites_autorisees',
        limit_choices_to={'role': 'etudiant'}, blank=True,
    )
    # Defined choices for affirmation type within an activity
    CHOIX_TYPE_AFF = [
        (2, 'Vrai/Faux'),
        (4, '4 Choix Fixes (Toujours/Parfois Vrai/Faux)') # Example name
    ]
    type_affirmation_requise = models.IntegerField(
        choices=CHOIX_TYPE_AFF,
        default=2,
        help_text="Définit le format des affirmations pour cette activité."
    )
    affirmations_associes = models.ManyToManyField(
        'Affirmation',
        related_name='activites',
        blank=True,
        help_text="Affirmations présentées dans cette activité."
    )
    destine_a = models.ForeignKey(Categorie, on_delete=models.SET_NULL, null=True, blank=True)
    encadrant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        limit_choices_to={'role': 'encadrant'}, related_name='activites_crees'
    )
    is_published = models.BooleanField(default=False, help_text="Indique si l'activité est lancée et visible par les étudiants.")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def nbr_affirmations_associe(self):
        return self.affirmations_associes.count()

    def clean(self):
        if self.code_activite:
            self.code_activite = self.code_activite.upper()
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titre} ({self.code_activite})"

# --- Affirmation Model ---
class Affirmation(models.Model):
    # Use choices from Activite for consistency
    CHOIX_REPONSES = Activite.CHOIX_TYPE_AFF
    # Keep choices for QCM index, even if options text is removed
    CHOIX_NUMERO_REPONSE = [
        (1, 'Choix 1'),
        (2, 'Choix 2'),
        (3, 'Choix 3'),
        (4, 'Choix 4'),
    ]

    # --- Fields set during creation FOR an activity ---
    affirmation = models.TextField(
        help_text="Le texte principal de l'affirmation."
        # Consider adding unique=True constraint later if needed for specific use cases
    )
    explication = models.TextField(
        blank=True, null=True,
        help_text="Explication (pourquoi vraie/fausse)."
    )
    nbr_reponses = models.IntegerField(
        choices=CHOIX_REPONSES,
        help_text="Format défini lors de la création pour une activité (2 ou 4)."
    )

    # Pour Vrai/Faux (si nbr_reponses=2) - OPTIONNEL, les affirmations sont neutres
    is_correct_vf = models.BooleanField(
        null=True, blank=True, # Toujours optionnel - les affirmations sont neutres
        help_text="OPTIONNEL: Valeur de vérité (si l'encadrant souhaite l'indiquer)"
    )

    encadrant = models.ForeignKey(
        settings.AUTH_USER_MODEL, # Or directly your Users model
        on_delete=models.SET_NULL, # Or models.CASCADE, depending on desired behavior
        null=True, # Allow null if an affirmation might not have an encadrant, or set in view
        blank=True, # If nullable in form/admin
        related_name='affirmations_creees'
    )

    # Pour 4 Choix Fixes (si nbr_reponses=4) - OPTIONNEL, les affirmations sont neutres
    reponse_correcte_qcm = models.IntegerField(
        choices=CHOIX_NUMERO_REPONSE, # Refers to the index of the fixed choice
        null=True, blank=True, # Toujours optionnel - les affirmations sont neutres
        help_text="OPTIONNEL: Index (1-4) du choix correct (si l'encadrant souhaite l'indiquer)"
    )

    # REMOVED option_1, option_2, option_3, option_4 fields

    created_at = models.DateTimeField(auto_now_add=True, editable=False, null=True)

    def clean(self):
        # Validation simplifiée : les affirmations sont maintenant neutres
        # Seul le format (nbr_reponses) est requis pour déterminer l'interface
        
        if self.nbr_reponses is None:
             raise ValidationError({"nbr_reponses": "Le format (nbr_reponses: 2 ou 4) est requis."})
        elif self.nbr_reponses not in [2, 4]:
             raise ValidationError({"nbr_reponses": f"Format invalide ({self.nbr_reponses}). Doit être 2 ou 4."})
        
        # Les champs is_correct_vf et reponse_correcte_qcm sont maintenant toujours optionnels
        # Les affirmations sont neutres par défaut

        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
         format_type = f" ({self.get_nbr_reponses_display()})" if self.nbr_reponses else " (Format non défini)"
         status = "[Neutre]"  # Les affirmations sont maintenant neutres par défaut
         if self.is_correct_vf is not None:
             status = f"[Encadrant: {'Vrai' if self.is_correct_vf else 'Faux'}]"
         elif self.nbr_reponses == 4 and self.reponse_correcte_qcm is not None:
             status = f"[Encadrant: Choix {self.reponse_correcte_qcm}]"
         return f"Affirmation {self.id} {format_type} {status}: {self.affirmation[:60]}..."

# --- Reponse Model ---
class Reponse(models.Model):
    activite = models.ForeignKey(Activite, on_delete=models.CASCADE)
    affirmation = models.ForeignKey(Affirmation, on_delete=models.CASCADE)
    etudiant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        limit_choices_to={'role': 'etudiant'}
    )
    reponse_vf = models.BooleanField(null=True, blank=True, help_text="Réponse V/F.")
    reponse_choisie_qcm = models.IntegerField(
        choices=Affirmation.CHOIX_NUMERO_REPONSE,
        null=True, blank=True, help_text="Réponse QCM (1-4)."
    )
    justification = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('activite', 'affirmation', 'etudiant'),)

    def clean(self):
        if not self.affirmation_id: 
             super().clean(); return
        try:
            affirmation = self.affirmation
        except Affirmation.DoesNotExist:
             super().clean(); return

        if affirmation.nbr_reponses is None:
             raise ValidationError(f"L'affirmation ID {affirmation.id} n'a pas de format défini.")
        
        if affirmation.nbr_reponses == 2:
            if self.reponse_choisie_qcm is not None: self.reponse_choisie_qcm = None
        elif affirmation.nbr_reponses == 4:
            if self.reponse_vf is not None: self.reponse_vf = None
        else: 
            raise ValidationError(f"Type d'affirmation invalide ({affirmation.nbr_reponses}).")
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        try:
            affirmation = self.affirmation
            etudiant_str = str(self.etudiant)
            activite_code = self.activite.code_activite
            if affirmation.nbr_reponses == 2:
                reponse_text = "Pas de réponse" if self.reponse_vf is None else str(self.reponse_vf)
            elif affirmation.nbr_reponses == 4:
                 reponse_text = "Pas de réponse" if self.reponse_choisie_qcm is None else str(self.reponse_choisie_qcm)
            else: reponse_text = "[Format inconnu]"
            return f"Réponse ({reponse_text}) de {etudiant_str} à '{affirmation}' dans {activite_code}"
        except Exception as e:
             return f"Réponse incomplète (ID: {self.id}, Erreur: {e})"

# --- Debrief Model ---
class Debrief(models.Model):
    feedback = models.TextField()
    reponse = models.OneToOneField(Reponse, on_delete=models.CASCADE)
    encadrant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        limit_choices_to={'role': 'encadrant'}
    )
    def __str__(self):
        try:
            encadrant_str = str(self.encadrant)
            reponse_str = str(self.reponse)
            return f"Debrief de {encadrant_str} pour {reponse_str}"
        except Exception as e:
             return f"Debrief incomplet (ID: {self.id}, Erreur: {e})"
