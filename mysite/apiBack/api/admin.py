from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
import copy # Needed to modify fieldsets
# Import Http response
from django.http import HttpResponseRedirect

# Import updated models
from .models import Users, Categorie, Activite, Affirmation, Reponse, Debrief

# --- Categorie Admin ---
@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom')
    search_fields = ('nom',)

# --- Inlines for Activite Admin ---
class ActiviteEtudiantInline(admin.TabularInline):
    model = Activite.etudiants_autorises.through
    verbose_name = "Etudiant Autorisé"
    verbose_name_plural = "Etudiants Autorisés"
    extra = 1
    autocomplete_fields = ['users']

class ActiviteAffirmationInline(admin.TabularInline):
    model = Activite.affirmations_associes.through
    verbose_name = "Affirmation Associée"
    verbose_name_plural = "Affirmations Associées"
    extra = 1
    autocomplete_fields = ['affirmation']


# --- Activite Admin ---
@admin.register(Activite)
class ActiviteAdmin(admin.ModelAdmin):
    list_display = ('code_activite', 'titre', 'encadrant', 'destine_a', 'nbr_affirmations_associe', 'created_at')
    search_fields = ('code_activite', 'titre', 'encadrant__username', 'encadrant__email')
    list_filter = ('destine_a', 'encadrant')
    inlines = [ActiviteEtudiantInline, ActiviteAffirmationInline]
    readonly_fields = ('nbr_affirmations_associe', 'created_at')
    autocomplete_fields = ['destine_a', 'encadrant']


# --- Affirmation Admin ---
@admin.register(Affirmation)
class AffirmationAdmin(admin.ModelAdmin):
    list_display = ('id', 'affirmation', 'nbr_reponses', 'is_correct_vf', 'reponse_correcte_qcm')
    search_fields = ('affirmation', 'explication')
    list_filter = ('nbr_reponses',)
    fieldsets = (
        (None, {
            'fields': ('affirmation', 'explication', 'nbr_reponses')
        }),
        ('Détails Vrai/Faux (si nbr_reponses=2)', {
            'classes': ('collapse',),
            'fields': ('is_correct_vf',),
        }),
        ('Détails QCM (si nbr_reponses=4)', {
            'classes': ('collapse',),
            'fields': ('option_1', 'option_2', 'option_3', 'option_4', 'reponse_correcte_qcm'),
        }),
    )

# --- Reponse Admin ---
@admin.register(Reponse)
class ReponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'etudiant', 'activite', 'affirmation', 'reponse_vf', 'reponse_choisie_qcm', 'timestamp')
    search_fields = ('etudiant__username', 'etudiant__email', 'activite__code_activite', 'affirmation__affirmation')
    list_filter = ('activite', 'affirmation')
    readonly_fields = ('timestamp',)
    autocomplete_fields = ['etudiant', 'activite', 'affirmation']

# --- Debrief Admin ---
@admin.register(Debrief)
class DebriefAdmin(admin.ModelAdmin):
    list_display = ('id', 'encadrant', 'reponse', 'feedback')
    search_fields = ('feedback', 'reponse__etudiant__username', 'encadrant__username')
    autocomplete_fields = ['reponse', 'encadrant']


# --- User Admin Customization ---
class UsersCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, label='Email Address')
    first_name = forms.CharField(max_length=30, required=False, label='First Name')
    last_name = forms.CharField(max_length=150, required=False, label='Last Name')
    role = forms.ChoiceField(choices=Users.ROLE_CHOICES, required=True)

    class Meta(UserCreationForm.Meta):
        model = Users
        fields = ('username', 'email', 'first_name', 'last_name', 'role')

    # Keep the previous save debug prints just in case
    def save(self, commit=True):
        print("--- Attempting to save user via UsersCreationForm ---")
        # print(f"Form is valid: {self.is_valid()}") # is_valid already checked by view
        print(f"Cleaned data: {self.cleaned_data}")
        try:
            user = super().save(commit=False)
            print(f"User object before commit: {user.__dict__}")
            if commit:
                print("--- Committing user save ---")
                user.save()
                print("--- User save committed successfully ---")
            else:
                print("--- Skipping user commit (commit=False) ---")
            return user
        except Exception as e:
            print(f"--- ERROR during UsersCreationForm save: {e} ---")
            raise

class UsersChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = Users
        fields = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')

@admin.register(Users)
class UsersAdmin(BaseUserAdmin):
    form = UsersChangeForm
    add_form = UsersCreationForm

    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'role')
    ordering = ('username',)

    # Correctly modify fieldsets for the CHANGE form
    fieldsets = copy.deepcopy(BaseUserAdmin.fieldsets)
    for section in fieldsets:
        if section[0] == 'Permissions':
            section[1]['fields'] = tuple(section[1]['fields']) + ('role',)
            break

    # Define add_fieldsets explicitly using password1/password2
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            # Use password1 and password2 - names used by UserCreationForm
            'fields': ('username', 'password1', 'password2'),
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'email'),
        }),
        ('Permissions', {
            'fields': ('role',),
        }),
    )

    # Override add_view for debugging (can likely be removed later)
    def add_view(self, request, form_url="", extra_context=None):
        if request.method == 'POST':
            print("--- Entering UsersAdmin add_view (POST request) ---")
            form = self.get_form(request)(request.POST, request.FILES)
            print("--- Checking if form is valid --- ")
            if form.is_valid():
                print("--- Form IS valid, proceeding to save --- ")
                # ... (rest of default save logic is handled by super().add_view) ...
            else:
                print("--- Form IS NOT valid --- ")
                print(f"Form errors: {form.errors.as_json()}")
        else:
            print("--- Entering UsersAdmin add_view (GET request) ---")
        return super().add_view(request, form_url, extra_context)

