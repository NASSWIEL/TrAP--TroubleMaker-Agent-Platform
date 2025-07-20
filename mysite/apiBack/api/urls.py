from django.urls import path
from .views import (
    ActiviteLoginView, LogoutAPIView, EncadrantLoginView,
    ActiviteAPIView, AffirmationAPIView, ReponseAPIView, DebriefAPIView,
    Generate, ChatbotAPIView, GeminiGenerateAffirmationsAPIView,
    GeminiMakeHarderAPIView, AuthTestView, EmailToIdResolverView,
    CategorieAPIView
)

urlpatterns = [
    # Support legacy path for encadrant login
    path('encadrant/login/', EncadrantLoginView.as_view(), name='encadrant_login_alias'),

    # Authentication endpoints
    path('login/encadrant/', EncadrantLoginView.as_view(), name='login_encadrant'),
    path('login/activite/', ActiviteLoginView.as_view(), name='login_activite'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    
    # Activity & Affirmation endpoints
    path('activites/', ActiviteAPIView.as_view(), name='activites_list'),
    path('activites/<str:pk>/', ActiviteAPIView.as_view(), name='activite_detail'),
    path('affirmations/', AffirmationAPIView.as_view(), name='affirmations_list'),
    path('affirmations/<int:pk>/', AffirmationAPIView.as_view(), name='affirmation_detail'),
    
    # Student response endpoints
    path('reponses/', ReponseAPIView.as_view(), name='reponses_list'),
    path('reponses/<int:pk>/', ReponseAPIView.as_view(), name='reponse_detail'),
    
    # Debrief endpoints
    path('debriefs/', DebriefAPIView.as_view(), name='debriefs_list'),
    path('debriefs/<int:pk>/', DebriefAPIView.as_view(), name='debrief_detail'),
    
    # Generation endpoints
    path('chatbot/', ChatbotAPIView.as_view(), name='chatbot'),
    path('generate/', Generate.as_view(), name='generate'),
    path('gemini/generate-affirmations/', GeminiGenerateAffirmationsAPIView.as_view(), name='generate_affirmations'),
    path('gemini/make-harder/', GeminiMakeHarderAPIView.as_view(), name='make_harder'),

    # User management endpoints
    path('users/get_ids_by_email/', EmailToIdResolverView.as_view(), name='email_to_id_resolver'),

    # Categories endpoint
    path('categories/', CategorieAPIView.as_view(), name='categories_list'),

    # Nouvelle route pour tester l'authentification
    path('auth-test/', AuthTestView.as_view(), name='auth-test'),
]