import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ScrollToTop } from '@/components/ScrollToTop';

// Pages publiques
import HomePage from '@/pages/HomePage';
import HomePageV2 from '@/pages/HomePageV2';
import AboutPage from '@/pages/AboutPage';
import CataloguePage from '@/pages/CataloguePage';
import ListingDetailPage from '@/pages/ListingDetailPage';
import ContactPage from '@/pages/ContactPage';
import ServicesPage from '@/pages/ServicesPage';
import ServicesPartnerPage from '@/pages/ServicesPartnerPage';
import PaymentResultPage from '@/pages/PaymentResultPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import NavTestPage from '@/pages/NavTestPage';
import NotificationsPage from '@/pages/NotificationsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Espace producteur
import ProducerDashboard from '@/pages/producer/ProducerDashboard';
import ProducerListings from '@/pages/producer/ProducerListings';
import ListingFormPage from '@/pages/producer/ListingFormPage';
import ProducerRequests from '@/pages/producer/ProducerRequests';

// Espace acheteur
import BuyerDashboard from '@/pages/buyer/BuyerDashboard';
import BuyerFavorites from '@/pages/buyer/BuyerFavorites';
import BuyerRequests from '@/pages/buyer/BuyerRequests';

// Espace prestataire
import PrestataireDashboard from '@/pages/prestataire/PrestataireDashboard';
import PrestataireProfile from '@/pages/prestataire/PrestataireProfile';

// Espace admin
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminVerifications from '@/pages/admin/AdminVerifications';
import AdminListings from '@/pages/admin/AdminListings';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminOfficialPrices from '@/pages/admin/AdminOfficialPrices';
import AdminServices from '@/pages/admin/AdminServices';
import AdminProviders from '@/pages/admin/AdminProviders';
import AdminMembershipPlans from '@/pages/admin/AdminMembershipPlans';
import AdminStats from '@/pages/admin/AdminStats';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Routes publiques */}
        <Route element={<PublicLayout />}>
          {/* Page d'accueil officielle (ex-/accueil-2). L'ancienne reste en
              brouillon sur /accueil-classique au cas où. */}
          <Route path="/" element={<HomePageV2 />} />
          <Route path="/accueil-classique" element={<HomePage />} />
          <Route path="/a-propos" element={<AboutPage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/annonce/:id" element={<ListingDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/partenaire" element={<ServicesPartnerPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/paiement/succes" element={<PaymentResultPage status="success" />} />
          <Route path="/paiement/annule" element={<PaymentResultPage status="cancel" />} />
        </Route>

        {/* Authentification (sans layout dashboard) */}
        <Route element={<PublicLayout />}>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/reinitialiser" element={<ResetPasswordPage />} />
        </Route>

        {/* Espace producteur */}
        <Route
          element={
            <ProtectedRoute role="producer">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/producteur/dashboard" element={<ProducerDashboard />} />
          <Route path="/producteur/annonces" element={<ProducerListings />} />
          <Route path="/producteur/annonce/nouvelle" element={<ListingFormPage />} />
          <Route path="/producteur/annonce/:id/modifier" element={<ListingFormPage />} />
          <Route path="/producteur/demandes" element={<ProducerRequests />} />
        </Route>

        {/* Espace acheteur */}
        <Route
          element={
            <ProtectedRoute role="buyer">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/acheteur/dashboard" element={<BuyerDashboard />} />
          <Route path="/acheteur/favoris" element={<BuyerFavorites />} />
          <Route path="/acheteur/demandes" element={<BuyerRequests />} />
        </Route>

        {/* Espace prestataire de services */}
        <Route
          element={
            <ProtectedRoute role="prestataire">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/prestataire/dashboard" element={<PrestataireDashboard />} />
          <Route path="/prestataire/profil" element={<PrestataireProfile />} />
        </Route>

        {/* Espace admin */}
        <Route
          element={
            <ProtectedRoute role="admin">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/utilisateurs" element={<AdminUsers />} />
          <Route path="/admin/verifications" element={<AdminVerifications />} />
          <Route path="/admin/annonces" element={<AdminListings />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/prix-officiels" element={<AdminOfficialPrices />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/prestataires" element={<AdminProviders />} />
          <Route path="/admin/forfaits" element={<AdminMembershipPlans />} />
          <Route path="/admin/statistiques" element={<AdminStats />} />
        </Route>

        {/* Page de test : navbar alternative (hors PublicLayout) */}
        <Route path="/nav-test" element={<NavTestPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
