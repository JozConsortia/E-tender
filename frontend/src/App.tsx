import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Forbidden from './pages/Forbidden'
import AdminDashboard from './pages/admin/AdminDashboard'
import Tenders from './pages/admin/Tenders'
import CreateTender from './pages/admin/CreateTender'
import AdminAudit from './pages/admin/Audit'
import CompanyVerification from './pages/admin/CompanyVerification'
import DocumentValidation from './pages/DocumentValidation'
import SecurityAlerts from './pages/admin/SecurityAlerts'
import ApplicationReport from './pages/ApplicationReport'
import ApplicantTenders from './pages/applicant/Tenders'
import TenderDetails from './pages/applicant/TenderDetails'
import Outcomes from './pages/applicant/Outcomes'
import Applications from './pages/applicant/Applications'
import ApplicationDetails from './pages/applicant/ApplicationDetails'
import BecDashboard from './pages/staff/BecDashboard'
import BecEvaluations from './pages/staff/BecEvaluations'
import BacDashboard from './pages/staff/BacDashboard'
import BacAdjudication from './pages/staff/BacAdjudication'
import ApproverDashboard from './pages/staff/ApproverDashboard'
import FinalApproval from './pages/staff/FinalApproval'
import AuditorDashboard from './pages/staff/AuditorDashboard'
import AuditorAudit from './pages/staff/AuditorAudit'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forbidden" element={<Forbidden />} />

      <Route element={<Layout />}>
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/tenders" element={<Tenders />} />
          <Route path="/admin/tenders/create" element={<CreateTender />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
          <Route path="/admin/companies" element={<CompanyVerification />} />
          <Route path="/admin/documents" element={<DocumentValidation />} />
          <Route path="/admin/alerts" element={<SecurityAlerts />} />
        </Route>

        <Route element={<ProtectedRoute roles={['APPLICANT']} />}>
          <Route path="/applicant" element={<Navigate to="/applicant/tenders" replace />} />
          <Route path="/applicant/tenders" element={<ApplicantTenders />} />
          <Route path="/applicant/tenders/:id" element={<TenderDetails />} />
          <Route path="/applicant/outcomes" element={<Outcomes />} />
          <Route path="/applicant/applications" element={<Applications />} />
          <Route path="/applicant/applications/:id" element={<ApplicationDetails />} />
        </Route>

        <Route element={<ProtectedRoute roles={['BEC']} />}>
          <Route path="/bec" element={<BecDashboard />} />
          <Route path="/bec/evaluations" element={<BecDashboard />} />
          <Route path="/bec/evaluations/:id" element={<BecEvaluations />} />
        </Route>

        <Route element={<ProtectedRoute roles={['BAC']} />}>
          <Route path="/bac" element={<BacDashboard />} />
          <Route path="/bac/adjudication" element={<BacDashboard />} />
          <Route path="/bac/adjudication/:id" element={<BacAdjudication />} />
        </Route>

        <Route element={<ProtectedRoute roles={['APPROVER']} />}>
          <Route path="/approver" element={<ApproverDashboard />} />
          <Route path="/approver/approvals" element={<ApproverDashboard />} />
          <Route path="/approver/approvals/:id" element={<FinalApproval />} />
        </Route>

        <Route element={<ProtectedRoute roles={['AUDITOR']} />}>
          <Route path="/auditor" element={<AuditorDashboard />} />
          <Route path="/auditor/audit" element={<AuditorAudit />} />
        </Route>

        <Route element={<ProtectedRoute roles={['BEC', 'BAC', 'APPROVER', 'ADMIN', 'AUDITOR']} />}>
          <Route path="/applications/:id/report" element={<ApplicationReport />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
