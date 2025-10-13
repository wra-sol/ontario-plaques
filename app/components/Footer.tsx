export default function Footer() {
  return (
    <footer className="footer">
      <div className="container small" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>By <a href="https://nathanielarfin.com">Nathaniel Arfin</a></span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="https://github.com/wra-sol/ontario-plaques">Contribute on GitHub</a>
        </div>
      </div>
    </footer>
  );
}
