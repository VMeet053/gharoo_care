export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="admin-footer">
      <div className="container-fluid px-3 px-lg-4 py-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
        <span className="text-muted">&copy; {year} adminHMD. All rights reserved.</span>
        <span className="text-muted">Enterprise Admin Dashboard</span>
      </div>
    </footer>
  );
}
