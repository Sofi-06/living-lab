import './DashboardFooter.css'

function DashboardFooter() {
  return (
    <footer className="dashboard-footer-shell" aria-label="Pie de pagina del dashboard">
      <div className="dashboard-footer">
        <div className="dashboard-footer-copy">
          <span>Living Lab</span>
          <span className="dashboard-footer-dot" aria-hidden="true" />
          <span>Campus Virtual</span>
          <span className="dashboard-footer-dot" aria-hidden="true" />
          <span>S</span>
          <span className="dashboard-footer-dot" aria-hidden="true" />
          <span>Universidad Santo Tomás</span>
        </div>
      </div>
    </footer>
  )
}

export default DashboardFooter
