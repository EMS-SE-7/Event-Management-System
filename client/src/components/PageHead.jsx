// Title block at the top of a page: small eyebrow label, heading, optional intro and actions.
export default function PageHead({ eyebrow, title, intro, children }) {
  return (
    <header className="page-head">
      <div className="page-head-text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {intro && <p className="muted">{intro}</p>}
      </div>
      {children && <div className="page-head-actions">{children}</div>}
    </header>
  )
}
