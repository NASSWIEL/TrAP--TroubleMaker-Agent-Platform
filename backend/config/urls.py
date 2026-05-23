"""
URL configuration for apiBack project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
# Removed LoginView, LogoutAPIView from here as they are handled in api.urls
from api.views import ChatbotAPIView #
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')), # Keep DRF login/logout for browsable API
    # path('api/chatbot/', ChatbotAPIView.as_view(), name='chatbot'), # This is likely also defined in api.urls, removed for clarity
    # Removed paths for api/login and api/logout as they are included below
    
    # Include all URLs from the 'api' app under the '/api/' prefix
    path("api/", include('api.urls')) 
]

# Keep static files serving for development
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
