import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="landing treasury-landing">

      {/* Government-style top navigation */}
      <div className="landing-nav treasury-nav">
        <div className="brand landing-brand">
          <span className="brand-mark logo-mark"><img src="/mpumalanga-logo.jpeg" alt="Mpumalanga Provincial Government" /></span>

          <span>
            <strong>Mpumalanga Provincial Treasury</strong>
            <small>Electronic Tender Management Portal</small>
          </span>
        </div>

        <div className="landing-nav-links">
          <a href="#tenders">Tender Opportunities</a>
          <a href="#suppliers">Suppliers</a>
          <a href="#procurement">Procurement</a>
          <Link className="button primary" to="/login">
            Sign in
          </Link>
        </div>
      </div>

      {/* Official-style government banner */}
      <div className="government-banner">
        <div>
          <span className="banner-label">MPUMALANGA PROVINCIAL GOVERNMENT</span>
          <strong>Provincial Treasury</strong>
        </div>

        <span className="banner-status">
          Electronic Procurement Portal
        </span>
      </div>

      {/* Main hero */}
      <div className="hero treasury-hero">

        <div className="hero-copy">

          <span className="pill">
            AI-assisted electronic procurement
          </span>

          <h1>
            Electronic Tender Management
            <em> for Mpumalanga.</em>
          </h1>

          <p>
            A secure digital platform for managing government tender
            opportunities, electronic bid submissions, document assessment
            and procurement administration.
          </p>

          <p className="hero-description">
            The platform is designed to modernise tender administration,
            reduce paper-based processes and provide procurement officials
            with intelligent tools for reviewing and managing submissions.
          </p>

          <div className="hero-actions">
            <Link
              className="button primary large"
              to="/login"
            >
              Access Procurement Portal
            </Link>

            <a
              className="button secondary large"
              href="#tenders"
            >
              View Tender Opportunities
            </a>
          </div>

          <div className="hero-meta">
            <span>Secure digital submission</span>
            <span>AI-assisted assessment</span>
            <span>Role-based access</span>
          </div>
        </div>

        {/* Portal preview */}
        <div className="hero-card treasury-card">

          <div className="hero-card-head">
            <div>
              <span className="card-kicker">
                PROCUREMENT PORTAL
              </span>

              <strong>
                Mpumalanga Treasury
              </strong>
            </div>

            <span className="secure-badge">
              SECURE
            </span>
          </div>

          <div className="portal-summary">

            <div className="summary-item">
              <span>Active Tenders</span>
              <strong>24</strong>
            </div>

            <div className="summary-item">
              <span>Open Opportunities</span>
              <strong>12</strong>
            </div>

            <div className="summary-item">
              <span>Submissions</span>
              <strong>186</strong>
            </div>

          </div>

          <div className="portal-section-title">
            Recent procurement activity
          </div>

          {[
            {
              reference: 'MPG/ICT/2026/018',
              title: 'ICT Infrastructure Services',
              status: 'Open',
            },
            {
              reference: 'MPG/CON/2026/011',
              title: 'Provincial Building Maintenance',
              status: 'Closing Soon',
            },
            {
              reference: 'MPG/SUP/2026/024',
              title: 'Office Equipment Supply',
              status: 'Evaluation',
            },
          ].map((tender) => (
            <div className="tender-preview" key={tender.reference}>

              <div>
                <small>{tender.reference}</small>
                <strong>{tender.title}</strong>
              </div>

              <span className="tender-status">
                {tender.status}
              </span>

            </div>
          ))}

          <div className="portal-footer">
            <span>AI-assisted document assessment</span>
            <span>•</span>
            <span>Human oversight</span>
          </div>
        </div>
      </div>

      {/* Tender opportunities */}
      <section
        id="tenders"
        className="landing-section official-section"
      >

        <div className="section-heading">
          <div>
            <span className="eyebrow">
              PROCUREMENT OPPORTUNITIES
            </span>

            <h2>
              Provincial tender opportunities
            </h2>
          </div>

          <p>
            Access government procurement opportunities and
            electronic tender information through one central
            platform.
          </p>
        </div>

        <div className="information-grid">

          <div className="information-card">
            <span className="card-number">01</span>
            <h3>Open Tenders</h3>

            <p>
              View currently advertised tender opportunities,
              requirements, closing dates and supporting
              documentation.
            </p>

            <Link to="/login">
              View opportunities →
            </Link>
          </div>

          <div className="information-card">
            <span className="card-number">02</span>
            <h3>Electronic Submission</h3>

            <p>
              Registered suppliers can submit tender responses
              and supporting documentation electronically through
              the procurement portal.
            </p>

            <Link to="/login">
              Submit a bid →
            </Link>
          </div>

          <div className="information-card">
            <span className="card-number">03</span>
            <h3>Procurement Notices</h3>

            <p>
              Access procurement announcements, tender updates
              and relevant notices published by authorised
              procurement officials.
            </p>

            <Link to="/login">
              View notices →
            </Link>
          </div>

        </div>
      </section>

      {/* Supplier section */}
      <section
        id="suppliers"
        className="landing-section supplier-section"
      >

        <div className="section-heading">
          <div>
            <span className="eyebrow">
              FOR SUPPLIERS
            </span>

            <h2>
              A digital gateway to public procurement
            </h2>
          </div>

          <p>
            Suppliers and businesses can access available
            procurement opportunities and manage their electronic
            submissions through the platform.
          </p>
        </div>

        <div className="supplier-panel">

          <div className="supplier-panel-main">
            <span className="pill">
              Supplier access
            </span>

            <h3>
              Participate in provincial procurement
              opportunities.
            </h3>

            <p>
              Registered applicants can view tender requirements,
              upload supporting documentation and track the status
              of their submissions from a central workspace.
            </p>

            <Link
              className="button primary"
              to="/login"
            >
              Supplier Sign In
            </Link>
          </div>

          <div className="supplier-features">

            <div>
              <strong>Digital Applications</strong>
              <span>
                Submit applications without relying on paper-based
                processes.
              </span>
            </div>

            <div>
              <strong>Document Management</strong>
              <span>
                Store and submit required supporting documents
                electronically.
              </span>
            </div>

            <div>
              <strong>Application Tracking</strong>
              <span>
                Monitor the progress and outcome of submitted
                applications.
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* Procurement officials */}
      <section
        id="procurement"
        className="landing-section official-section"
      >

        <div className="section-heading">
          <div>
            <span className="eyebrow">
              FOR PROCUREMENT OFFICIALS
            </span>

            <h2>
              Intelligent procurement administration
            </h2>
          </div>

          <p>
            Give authorised officials the tools needed to manage
            tender processes, assess submissions and maintain
            procurement records.
          </p>
        </div>

        <div className="role-grid">

          <div>
            <span className="role-code">ADM</span>
            <b>Administrator</b>

            <p>
              Manage tenders, users, requirements and system
              administration.
            </p>
          </div>

          <div>
            <span className="role-code">EVA</span>
            <b>Evaluation Committee</b>

            <p>
              Review submissions and use AI-assisted document
              analysis to support evaluation.
            </p>
          </div>

          <div>
            <span className="role-code">BAC</span>
            <b>Bid Adjudication</b>

            <p>
              Review evaluation outcomes and adjudicate procurement
              recommendations.
            </p>
          </div>

          <div>
            <span className="role-code">APR</span>
            <b>Final Approver</b>

            <p>
              Review authorised recommendations and confirm final
              procurement decisions.
            </p>
          </div>

          <div>
            <span className="role-code">AUD</span>
            <b>Auditor</b>

            <p>
              Access procurement history and system records through
              controlled read-only access.
            </p>
          </div>

          <div>
            <span className="role-code">AI</span>
            <b>AI Assessment</b>

            <p>
              Assist officials by analysing submitted documents
              against predefined tender requirements.
            </p>
          </div>

        </div>
      </section>

      {/* Principles */}
      <section className="principles-section">

        <div className="principles-inner">

          <div>
            <span className="eyebrow">
              DIGITAL PROCUREMENT
            </span>

            <h2>
              Supporting transparent and accountable procurement.
            </h2>
          </div>

          <div className="principles-list">

            <div>
              <strong>Efficiency</strong>
              <span>
                Reduce administrative effort through digital
                procurement workflows.
              </span>
            </div>

            <div>
              <strong>Transparency</strong>
              <span>
                Maintain structured procurement records and
                traceable activities.
              </span>
            </div>

            <div>
              <strong>Accountability</strong>
              <span>
                Ensure procurement activities are performed by
                authorised users according to assigned roles.
              </span>
            </div>

            <div>
              <strong>Intelligent Assistance</strong>
              <span>
                Use AI to assist with repetitive document analysis
                while retaining human oversight over procurement
                decisions.
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer treasury-footer">

        <div className="footer-brand">

          <div className="brand">
            <span className="brand-mark logo-mark">
              <img src="/mpumalanga-logo.jpeg" alt="Mpumalanga Provincial Government" />
            </span>

            <span>
              <strong>
                Mpumalanga Provincial Treasury
              </strong>

              <small>
                Electronic Tender Management Portal
              </small>
            </span>
          </div>

          <p>
            Digital procurement platform prototype for the
            modernisation of electronic tender administration.
          </p>
        </div>

        <div className="footer-links">

          <div>
            <strong>Portal</strong>
            <Link to="/login">Sign in</Link>
            <a href="#tenders">Tender Opportunities</a>
            <a href="#suppliers">Suppliers</a>
          </div>

          <div>
            <strong>Information</strong>
            <a href="#procurement">Procurement</a>
            <a href="#tenders">Notices</a>
            <a href="#suppliers">Supplier Information</a>
          </div>

        </div>

        <div className="footer-bottom">
          <span>
            © 2026 Mpumalanga Provincial Treasury Prototype
          </span>

          <span>
            Electronic Procurement Portal
          </span>
        </div>

      </footer>

    </div>
  )
}